import GamePlay from "./GamePlay";
import MRes from "../framework/MRes";
import { L } from "../framework/LocalData";
import Game from "./Game";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
    /** 每一行的偏移量 */
    CUBELINE_OFFSET: { X: 43.5, Y: 72 },
    /** 每一行的间隔 */
    LATOUT_SPACE: 10,
    /** cubeshadow动画时间 */
    SHADOW_TIME: 0.5,
    /** 行数 */
    ROW: 7,
    /** 列数 */
    COL: 7,
}

/**
 * 游戏绘制封装类
 */
@ccclass
export default class GameDraw extends cc.Component {
    /** @type {GameDraw} */
    static ins

    /** @type {cc.Prefab} */
    @property(cc.Prefab)
    cube_bg_prefab = null

    /** @type {cc.Node} */
    @property(cc.Node)
    cube_bg_parent = null

    /** @type {cc.Node} 影子父节点 */
    @property(cc.Node)
    shadow_parent = null

    /** @type {cc.Prefab} 影子prefab */
    @property(cc.Prefab)
    shadow_prefab = null

    onLoad() {
        /** cube节点数组 */
        this.cube_array = Array.of()

        // 初始化所有的cube
        this.draw_cube_bg()

        GameDraw.ins = this
    }

    /**
     * 获取某一个cube
     * @param {cc.Vec2} p
     * @returns {cc.Node} 
     */
    get_cube(p) {
        try {
            return this.cube_array[p.x][p.y]
        } catch (error) {
            // 注意此处只能return undefined
            // 因为array[m][-1]=undefined
            return
        }

    }

    /** 
     * 绘制所有的cube背景
     * - 每一行为一个layout（配置为：）
     * - 每一行均有7个点
     * - 单数行向右偏移半个格子
     */
    draw_cube_bg() {
        for (let x = 0; x < C.ROW; x++) {
            // 新建存储
            this.cube_array.push(Array.of())
            // 配置node
            let cube_line = new cc.Node("cube_line")
            cube_line.parent = this.cube_bg_parent
            cube_line.setPositionY(C.CUBELINE_OFFSET.Y * (3 - x))
            if (x % 2 === 0) {
                cube_line.setPositionX(C.CUBELINE_OFFSET.X)
            }
            // 配置layout
            let layout = cube_line.addComponent(cc.Layout)
            layout.type = cc.Layout.Type.HORIZONTAL
            layout.resizeMode = cc.Layout.ResizeMode.CONTAINER
            layout.spacingX = C.LATOUT_SPACE
            // 创建7个子cube
            for (let y = 0; y < C.COL; y++) {
                let cube_bg = cc.instantiate(this.cube_bg_prefab)
                cube_bg.parent = cube_line
                // 存储每一个小cube
                this.cube_array[x].push(cube_bg)
                // 在node上存储p
                ///! （感觉并不应该这样写！）
                cube_bg.p = cc.v2(x, y)
            }
        }
    }

    /** 
     * 根据数据刷新所有的cube背景
     * - 请紧接着draw_cube_bg()后调用
     */
    update_cube_bg() {
        let game = GamePlay.ins.game
        for (let x = 0; x < game.map_array.length; x++) {
            for (let y = 0; y < game.map_array[x].length; y++) {
                let p = cc.v2(x, y)
                if (game.get_p_value(p) === -1) {
                    // 不能使用active，否则会打乱layout中其他节点的顺序
                    // this.get_cube(p).active = false
                    // 通过删除sprite的方式隐藏
                    this.change_cube_sprite(p, null)
                    continue
                }
                this.change_cube_sprite(p, MRes.ins.array_cube[game.get_p_value(p)])
            }
        }
    }

    /**
     * 单点合并的动画（1次）
     * @param {cc.Vec2} p 合并的主点
     * @param {[cc.Vec2]} m_array 合并的其他点
     */
    merge_animation(p, m_array) {
        /** 合并主点的position（相对于cc.Vec2.ZERO） */
        let p0 = this.get_cube(p).position.add(this.get_cube(p).parent.position)
        /** 影子的spriteframe */
        let shadow_sf = MRes.ins.array_cube_shadow[GamePlay.ins.game.get_p_value(p)]
        // 根据合并数组合并所有的点
        m_array.forEach(e => {
            // 获取当前点的信息
            let e_node = this.get_cube(e)
            if (e_node === undefined) { return }
            let e_sp = e_node.getComponent(cc.Sprite)
            if (e_sp.spriteFrame === null) { return }
            // 注意上面两个特殊情况的return：不合并不存在的点；不合并值为-1的点
            // 修改当前点的sf
            e_sp.spriteFrame = MRes.ins.array_cube[0]
            // 新建一个影子
            let s = cc.instantiate(this.shadow_prefab)
            s.parent = this.shadow_parent
            s.position = e_node.position.add(e_node.parent.position)
            s.getComponent(cc.Sprite).spriteFrame = shadow_sf
            /** 其中一个副点的position */
            let p1 = s.position
            // 计算影子角度
            let a = cc.pAngleSigned(cc.v2(1, 0), p0.sub(p1))
            s.rotation = -a * 180 / Math.PI
            // 影子动作
            let action = cc.sequence(
                cc.spawn(
                    cc.moveTo(C.SHADOW_TIME, p0),
                    cc.fadeOut(C.SHADOW_TIME)
                ),
                cc.callFunc(() => {
                    // 移除影子
                    s.removeFromParent()
                }),
            )
            s.runAction(action)
        })
        // 动画结束后修改数据
        // 使用Promise进行包装
        return new Promise((resolve, reject) => {
            this.scheduleOnce(() => {
                // // 动画结束后再调整数据
                // // 判定8的特殊情况
                // if (GamePlay.ins.game.get_p_value(p) === 7) {
                //     let m_array = GamePlay.ins.game.merge_all_around(p)
                //     this.merge_cube_bg(p, m_array)
                //     this.get_cube(p).getComponent(cc.Sprite).spriteFrame = MRes.ins.array_cube[0]
                //     GamePlay.ins.score += 100
                // } else if (GamePlay.ins.game.get_p_value(p) < 7) {
                //     GamePlay.ins.game.merge(p)
                //     this.get_cube(p).getComponent(cc.Sprite).spriteFrame = MRes.ins.array_cube[GamePlay.ins.game.get_p_value(p)]
                // } else {
                //     //
                // }
                // // 加分
                // if (GamePlay.ins.game.get_p_value(p) === 0) {
                //     ///! 可以预见的一个bug是，get_p_value(p)=0的情况下，分数异常；即全消除的情况下，分数异常
                //     /// 通过这个方式解决
                //     return
                // }
                // GamePlay.ins.score += (m_array.length + 1) * (GamePlay.ins.game.get_p_value(p) - 1)
                if (GamePlay.ins.game.get_p_value(p) >= 7) {
                    this.change_cube_sprite(p, MRes.ins.array_cube[0])
                } else {
                    this.change_cube_sprite(p, MRes.ins.array_cube[GamePlay.ins.game.get_p_value(p) + 1])
                }
                resolve()
                // 并不在绘制过程中修改数据，而是在外部显式调用then()去修改数据
            }, C.SHADOW_TIME)
        })
    }

    /**
     * 更改cube的spriteframe
     * @param {cc.Vec2} p 
     * @param {cc.SpriteFrame} sf 
     */
    change_cube_sprite(p, sf) {
        this.get_cube(p).getComponent(cc.Sprite).spriteFrame = sf
    }
}
