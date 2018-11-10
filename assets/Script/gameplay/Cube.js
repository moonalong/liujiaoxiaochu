import MRes from "../framework/MRes";
import { G } from "../framework/Global";
import GamePlay from "./GamePlay";

const { ccclass, property } = cc._decorator

/** 配置函数 */
const C = {
    /** 单个cube的碰撞器位置 */
    CL_SINGLE: cc.v2(0, 0),
    /** 横向cube的碰撞器位置 */
    CL_HOR: cc.v2(-37.5, 0),
    /** 左斜cube的碰撞器位置 */
    CL_LEFT: cc.v2(-21.75, 36),
    /** 右斜cube的碰撞器位置 */
    CL_RIGHT: cc.v2(21.75, 36),
    /** 旋转动画时间 */
    TIME_ROTATION: 0.2,
    /** 随机概率 */
    PROBABILITY: {
        // type
        T_SINGLE: 0.1,
        T_HOR: 0.3,
        T_LEFT: 0.3,
        T_RIGHT: 0.3,
        // value
        V_1: 0.3,
        V_2: 0.3,
        V_3: 0.15,
        V_4: 0.15,
        V_5: 0.05,
        V_6: 0.05,
    }
}

export const CubeType = {
    /** 单个 */
    SINGLE: Symbol("SINGLE"),
    /** 横向 */
    HOR: Symbol("HOR"),
    /** 顶部向左倾斜 */
    LEFT: Symbol("LEFT"),
    /** 顶部向右倾斜 */
    RIGHT: Symbol("RIGHT"),
}

/**
 * 单个cube的数据
 */
@ccclass
export class Cube extends cc.Component {

    /** @type {Cube} */
    static ins

    /** @type {[cc.Node]} */
    @property(cc.Node)
    cube_node_array = []

    /** @type {cc.SpriteFrame} 主点spriteframe */
    get sf() { return MRes.ins.array_cube[this.v] }

    /** @type {cc.SpriteFrame} 副点spriteframe */
    get next_sf() { return MRes.ins.array_cube[this.next_v] }

    /** @type {cc.Vec2} 当前node的position */
    set position(pos) { this.node.position = pos }
    get position() { return this.node.position }

    /** @type {number} 当前node的rotation */
    set rotation(roa) { this.node.rotation = roa }
    get rotation() { return this.node.rotation }

    /** @type {number} 当前node的scale */
    set scale(scale) { this.node.scale = scale }
    get scale() { return this.node.scale }

    onLoad() {
        /** cube形状 */
        this.type
        /** cube方向；true表示正向，false表示反向；默认为true */
        this.direction = true
        /** @type {boolean} 如果有副点，副点的值是否与主点相同 */
        this.is_same = false
        /** cube主点的value */
        this.v
        /** cube副点的value */
        this.next_v
        /** 碰撞器 */
        this.cl = this.node.getComponent(cc.CircleCollider)
        /** @type {[CubeType]} 可行type数组 */
        this.type_array
        /** @type {[number]} 可行value数组 */
        this.value_array

        Cube.ins = this
    }

    /** 更新cube的随机信息
     * @returns {boolean}
     */
    update_cube_info() {
        this.type_array = []
        this.value_array = []

        this.type_array = Array.from(GamePlay.ins.game.empty_type())
        this.value_array = Array.from(GamePlay.ins.game.empty_value())

        // 无法创建，则调用游戏失败
        if (this.type_array.length === 0) {
            GamePlay.ins.game_fail()
            return false
        }
        // 创建成功
        return true
    }

    /** 获取一个随机type
     * - 先按照概率计算一次
     * - 如果没有当前的type，则按照平均概率再计算一次
     */
    random_type() {
        let r = Math.random()
        let type
        if (r < C.PROBABILITY.T_SINGLE) { type = CubeType.SINGLE }
        else if (r < C.PROBABILITY.T_SINGLE + C.PROBABILITY.T_HOR) { type = CubeType.HOR }
        else if (r < C.PROBABILITY.T_SINGLE + C.PROBABILITY.T_HOR + C.PROBABILITY.T_LEFT) { type = CubeType.LEFT }
        else { type = CubeType.RIGHT }
        ///!!! 重点注意：Array.include()方法，由于微信小游戏未支持，所以不要使用！
        if (!new Set(this.type_array).has(type)) {
            return G.random_item_form_array(this.type_array)
        } else {
            return type
        }
    }

    /** 获取一个随机value
     * - 算法同random_type()
     */
    random_value() {
        let r = Math.random()
        let value
        if (r < C.PROBABILITY.V_1) { value = 1 }
        else if (r < C.PROBABILITY.V_1 + C.PROBABILITY.V_2) { value = 2 }
        else if (r < C.PROBABILITY.V_1 + C.PROBABILITY.V_2 + C.PROBABILITY.V_3) { value = 3 }
        else if (r < C.PROBABILITY.V_1 + C.PROBABILITY.V_2 + C.PROBABILITY.V_3 + C.PROBABILITY.V_4) { value = 4 }
        else if (r < C.PROBABILITY.V_1 + C.PROBABILITY.V_2 + C.PROBABILITY.V_3 + C.PROBABILITY.V_4 + C.PROBABILITY.V_5) { value = 5 }
        else { value = 6 }
        ///!!! 同random_type()
        if (!new Set(this.value_array).has(value)) {
            return G.random_item_form_array(this.value_array)
        } else {
            return value
        }
    }

    /**
     * 创建一个随机cube
     */
    create_random_cube() {
        // 获取随机信息失败
        if (!this.update_cube_info()) { return }

        let type = this.random_type()
        // test
        // let type = CubeType.HOR
        switch (type) {
            case CubeType.SINGLE:
                this.create_random_single_cube()
                break;
            case CubeType.HOR:
                this.create_random_hor_cube()
                break;
            case CubeType.LEFT:
                this.create_random_left_cube()
                break
            case CubeType.RIGHT:
                this.create_random_right_cube()
                break
            default:
                break;
        }
        // 构建is_same
        if (this.next_v === this.v) { this.is_same = true } else { this.is_same = false }
    }

    /** 创建一个随机cube，并且与当前的cube不同 */
    create_different_random_cube() {
        let old_cube = {
            type: this.type,
            v: this.v,
            next_v: this.next_v
        }
        return new Promise((resolve, reject) => {
            let f = () => {
                this.create_random_cube()
                if (this.type === old_cube.type && this.v === old_cube.v && this.next_v === old_cube.next_v) {
                    return f()
                } else {
                    resolve()
                }
            }
            f()
        })
    }

    /** 创建一个单个cube */
    create_random_single_cube() {
        // 数据
        this.type = CubeType.SINGLE
        this.v = this.random_value()
        this.next_v = null
        // 样式
        this.un_active_all_children_cube()
        this.cube_node_array[0].active = true
        this.cube_node_array[0].getComponent(cc.Sprite).spriteFrame = this.sf
        // 碰撞器
        this.cl.offset = C.CL_SINGLE
    }

    /** 创建一个横向cube */
    create_random_hor_cube() {
        // 数据
        this.type = CubeType.HOR
        this.v = this.random_value()
        this.next_v = this.random_value()
        // 样式
        this.un_active_all_children_cube()
        this.cube_node_array[1].active = true
        this.cube_node_array[2].active = true
        this.cube_node_array[1].getComponent(cc.Sprite).spriteFrame = this.sf
        this.cube_node_array[2].getComponent(cc.Sprite).spriteFrame = this.next_sf
        // 碰撞器
        this.cl.offset = C.CL_HOR
    }

    /** 创建一个左斜cube */
    create_random_left_cube() {
        // 数据
        this.type = CubeType.LEFT
        this.v = this.random_value()
        this.next_v = this.random_value()
        // 样式
        this.un_active_all_children_cube()
        this.cube_node_array[3].active = true
        this.cube_node_array[4].active = true
        this.cube_node_array[3].getComponent(cc.Sprite).spriteFrame = this.sf
        this.cube_node_array[4].getComponent(cc.Sprite).spriteFrame = this.next_sf
        // 碰撞器
        this.cl.offset = C.CL_LEFT
    }

    /** 创建一个右斜cube */
    create_random_right_cube() {
        // 数据
        this.type = CubeType.RIGHT
        this.v = this.random_value()
        this.next_v = this.random_value()
        // 样式
        this.un_active_all_children_cube()
        this.cube_node_array[5].active = true
        this.cube_node_array[6].active = true
        this.cube_node_array[5].getComponent(cc.Sprite).spriteFrame = this.sf
        this.cube_node_array[6].getComponent(cc.Sprite).spriteFrame = this.next_sf
        // 碰撞器
        this.cl.offset = C.CL_RIGHT
    }

    /** active=false所有的子node */
    un_active_all_children_cube() {
        this.cube_node_array.forEach((e) => {
            e.active = false
        })
    }

    /** 旋转180度 */
    rotate() {
        if (this.rotate_count === undefined) {
            // 旋转次数
            this.rotate_count = 0
        }
        this.rotate_count++
        if (this.rotate_count === 1) {
            this.rotate_180()
        }
    }

    /** 
     * 旋转动作列表
     * - 不要改动，我也不知道为啥能实现！
     */
    rotate_180() {
        return new Promise((resolve, reject) => {
            if (this.rotate_count === 0) {
                resolve()
                return
            }
            let action = cc.sequence(
                cc.rotateBy(C.TIME_ROTATION, 180),
                cc.callFunc(() => {
                    Cube.ins.direction = !Cube.ins.direction
                    this.rotate_count--
                    if (this.rotate_count >= 1) { this.rotate_count = 1 }
                    this.rotate_180()
                }),
            )
            this.node.runAction(action)
        })
    }
}