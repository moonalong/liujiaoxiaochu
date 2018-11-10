import Game from "./Game";
import { L } from "../framework/LocalData";
import GameDraw from "./GameDraw";
import CubeCollision from "./CubeCollision";
import { Cube } from "./Cube";
import PanelGame from "../panel/PanelGame";
import MPanel from "../framework/MPanel";
import { G } from "../framework/Global";
import MRes from "../framework/MRes";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
    /** 道具-换一换初始次数 */
    PROP_CHANGE_COUNT: 3,
    /** 道具-单点消除初始次数 */
    PROP_REMOVE_COUNT: 3,
}

/**
 * 游戏主逻辑
 */
@ccclass
export default class GamePlay extends cc.Component {

    /** @type {GamePlay} 运行实例 */
    static ins

    /** @type {cc.Node} 新cube */
    @property(cc.Node)
    new_cube = null

    /** @type {cc.Node} 新cube的背景 */
    @property(cc.Node)
    new_cube_bg = null

    /** 分数 */
    set score(s) {
        this._score = s
        // 更新score显示
        PanelGame.ins.update_score()
    }
    get score() { return this._score }

    /** 道具-换一换可行次数 */
    set prop_change_count(c) {
        this._prop_change_count = c
        PanelGame.ins.update_prop_change_count()
    }
    get prop_change_count() { return this._prop_change_count }

    /** 道具-remove可行次数 */
    set prop_remove_count(c) {
        this._prop_remove_count = c
        PanelGame.ins.update_prop_remove_count()
    }
    get prop_remove_count() { return this._prop_remove_count }

    onLoad() {
        /** 游戏数据 */
        this.game = new Game()
        this.game.init()
        this._score = 0

        /** 道具-change动画是否完成 */
        this.is_prop_change_done = false
        /** 道具-remove动画是否完成 */
        this.is_prop_remove_done = false

        this.open_collider_manager()
        this.set_touch_event()

        // 保存运行实例
        GamePlay.ins = this
    }

    /** 游戏初始化 */
    game_init() {
        this.game.init()
        this.score = 0

        this.is_prop_change_done = true
        this.prop_change_count = C.PROP_CHANGE_COUNT
        this.is_prop_remove_done = true
        this.prop_remove_count = C.PROP_REMOVE_COUNT
    }

    /** 游戏开始 */
    game_start() {
        cc.log("[GamePlay.start] 游戏开始")
        this.game_init()
        Cube.ins.create_random_cube()
    }

    /** 游戏重新开始 */
    game_restart() {
        cc.log("[GamePlay.restart] 游戏重新开始")
        this.game_init()
        GameDraw.ins.update_cube_bg()
        Cube.ins.create_random_cube()
    }

    /** 游戏结束 */
    game_fail() {
        cc.log("[GamePlay.fail] 游戏结束")
        MPanel.ins.panel_show("PanelScore")
    }

    /** 设置touch事件 */
    set_touch_event() {
        // 设置音效
        this.new_cube.on(cc.Node.EventType.TOUCH_START, () => {
            // Audio
        })
        // 设置旋转
        this.new_cube.on(cc.Node.EventType.TOUCH_END,
            /** @param {cc.Touch} event */
            (event) => {
                if (
                    event.getDelta().equals(cc.Vec2.ZERO)
                    && event.getLocationX() === event.getStartLocation().x
                    && event.getLocationY() === event.getStartLocation().y
                ) {
                    // 旋转
                    cc.log("旋转")
                    Cube.ins.rotate()
                }
            }
        )
        // 设置移动
        this.new_cube.on(cc.Node.EventType.TOUCH_MOVE,
            /** @param {cc.Touch} event */
            (event) => {
                if (!event.getDelta().equals(cc.Vec2.ZERO)) {
                    cc.log("移动")
                    this.new_cube.position = this.node.convertTouchToNodeSpaceAR(event)//.add(cc.v2(0, 100))
                }
            }
        )
        // 设置放置
        this.new_cube.on(cc.Node.EventType.TOUCH_END,
            /** @param {cc.Touch} event */
            (event) => {
                cc.log("放置（不论放置成功与否）")
                CubeCollision.ins.put()
            }
        )
        // 设置放置失败（超出屏幕）
        this.new_cube.on(cc.Node.EventType.TOUCH_CANCEL,
            /** @param {cc.Touch} event */
            (event) => {
                cc.log("放置失败")
                Cube.ins.position = cc.v2(0, -400)
            }
        )
    }

    /** 打开碰撞检测 */
    open_collider_manager() {
        let manager = cc.director.getCollisionManager()
        manager.enabled = true
        // 测试绘制
        // manager.enabledDebugDraw = true
    }

    /**
     * 道具事件-换一换
     */
    prop_change() {
        cc.log("[GamePlay.prop.change]")
        if (!this.is_prop_change_done) { return }
        if (this.prop_change_count < 1) { return }
        this.is_prop_change_done = false
        let action = cc.sequence(
            cc.scaleTo(0.2, 0),
            cc.callFunc(() => {
                Cube.ins.create_different_random_cube().then(() => {
                    Cube.ins.rotation = 0
                    Cube.ins.direction = true
                    Cube.ins.cl.enabled = true

                })
            }),
            cc.scaleTo(0.2, 1),
            cc.callFunc(() => {
                this.is_prop_change_done = true
                this.prop_change_count--
            }),
        )
        Cube.ins.node.runAction(action)
    }

    /**
     * 道具事件-消除单点
     */
    prop_remove() {
        cc.log("[GamePlay.prop.remove]")

        this.is_able_to_remove = true

        // 第一次点击则注册事件
        if (this.is_first_set === undefined) { this.is_first_set = 0 } // 0!=undefined
        else { return }
        for (let x = 0; x < GameDraw.ins.cube_array.length; x++) {
            for (let y = 0; y < GameDraw.ins.cube_array[x].length; y++) {
                let n = GameDraw.ins.get_cube(cc.v2(x, y))
                G.set_event(n, false, () => {
                    if (!this.is_prop_remove_done) { return }
                    if (this.prop_remove_count < 1) { return }
                    if (this.game.get_p_value(n.p) <= 0) { return }
                    if (!this.is_able_to_remove) { return }
                    this.is_prop_remove_done = false
                    let action = cc.sequence(
                        cc.fadeOut(0.2),
                        cc.callFunc(() => {
                            // 数据
                            this.game.set_p_value(n.p, 0)
                            // 样式
                            GameDraw.ins.change_cube_sprite(n.p, MRes.ins.array_cube[0])
                        }),
                        cc.fadeIn(0.2),
                        cc.callFunc(() => {
                            this.is_prop_remove_done = true
                            this.prop_remove_count--
                            this.is_able_to_remove = false
                        }),
                    )
                    n.runAction(action)
                })
            }
        }
    }
}
