import MRes from "../framework/MRes";
import GamePlay from "./GamePlay";
import { Cube, CubeType } from "./Cube";
import GameDraw from "./GameDraw";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
    /** 合并的时间间隔 */
    MERGE_INTERVAL: 0.1
}

@ccclass
export default class CubeCollision extends cc.Component {

    /** @type {CubeCollision} */
    static ins

    /** @type {cc.SpriteFrame} 放置在上面时候的显示 */
    @property(cc.SpriteFrame)
    on_sf = null

    onLoad() {
        /** 是否已经落下 */
        this.is_put = false

        /** 不放置的时候的显示 */
        this.off_sf = MRes.ins.array_cube[0]

        CubeCollision.ins = this
    }

    /**
     * 当碰撞产生的时候调用
     * @param {cc.Collider} other 产生碰撞的另一个碰撞组件
     * @param {cc.Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionEnter(other, self) {
        // 清理绘制
        this.clear_draw()
        // 新绘制
        switch (Cube.ins.type) {
            case CubeType.SINGLE:
                this.single_handle_enter(other, self)
                break
            case CubeType.HOR:
                this.hor_handle_enter(other, self)
                break
            case CubeType.LEFT:
                this.left_handle_enter(other, self)
                break
            case CubeType.RIGHT:
                this.right_handle_enter(other, self)
                break
            default:
                break
        }
    }

    /**
     * 当碰撞产生后，碰撞结束前的情况下，每次计算碰撞结果后调用
     * @param {cc.Collider} other 产生碰撞的另一个碰撞组件
     * @param {cc.Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionStay(other, self) {
        //
    }

    /**
     * 当碰撞结束后调用
     * @param {cc.Collider} other 产生碰撞的另一个碰撞组件
     * @param {cc.Collider} self  产生碰撞的自身的碰撞组件
     */
    onCollisionExit(other, self) {
        // 修改了绘制算法，因此exit的时候不进行绘制变动
        // switch (Cube.ins.type) {
        //     case CubeType.SINGLE:
        //         this.single_handle_exit(other, self)
        //         break
        //     case CubeType.HOR:
        //         this.hor_handle_exit(other, self)
        //         break
        //     case CubeType.LEFT:
        //         this.left_handle_exit(other, self)
        //         break
        //     case CubeType.RIGHT:
        //         this.right_handle_exit(other, self)
        //         break
        //     default:
        //         break;
        // }
        this.put_with_collider(other, self)
    }

    //////////
    // draw
    //////////

    /** 
     * 清理所有的绘制
     * - 目前采用遍历全部点的方法
     * - 如果要考虑效率优化，可以记录被改动的点
     */
    clear_draw() {
        GameDraw.ins.update_cube_bg()
    }

    //////////
    // handle
    //////////

    /** 单点递归合并 */
    single_p_merge(p) {
        let f = new Promise((resolve, reject) => {
            // 注意时间间隔，防止由于主副点合并次序导致的数据异常
            this.scheduleOnce(() => {
                // 获取被合并点数组（并不改变数据）
                let m_array = GamePlay.ins.game.merge(p)
                // 单点合并完成
                if (m_array === undefined) {
                    // 判定主点和父点的单点合并均已经完成
                    this.merge_done_count++
                    if (this.merge_done_count >= this.merge_done_count_max) {
                        // 创建新的cube
                        Cube.ins.create_random_cube()
                        Cube.ins.rotation = 0
                        Cube.ins.direction = true
                        Cube.ins.cl.enabled = true
                        let action = cc.scaleTo(0.2, 1)
                        Cube.ins.node.runAction(action)
                    }
                    // 跳出递归
                    return
                }
                GameDraw.ins.merge_animation(p, m_array).then(() => {
                    // 合并动画完成后加分
                    GamePlay.ins.score += (m_array.length + 1) * (GamePlay.ins.game.get_p_value(p))
                    // 合并动画完成后改变数据
                    GamePlay.ins.game.merge_data(p, m_array)
                    // 如果合并后当前点为7，则进行额外一次的周围点合并
                    if (GamePlay.ins.game.get_p_value(p) === 7) {
                        let m = GamePlay.ins.game.merge_around(p)
                        GameDraw.ins.merge_animation(p, m).then(() => {
                            GamePlay.ins.game.merge_around_data(p, m)
                            GamePlay.ins.score += 100
                        })
                    }
                    // 数据改变后抛出resolve，进行此点的下一次合并
                    resolve()
                })
            }, C.MERGE_INTERVAL)
        })
        f.then(() => {
            return this.single_p_merge(p)
        })
    }

    /** 放置 */
    put() {
        this.is_put = true
        Cube.ins.cl.enabled = false // 用来触发exit
        // 如果没有触发放置
        this.scheduleOnce(() => {
            if (this.is_put) {
                // 清理绘制
                this.clear_draw()
                // 初始化cube
                Cube.ins.position = cc.v2(0, -400)
                Cube.ins.cl.enabled = true
                // 重置放置flag
                this.is_put = false
            }
        }, 0.1)
    }

    /**
     * 放置（传入other和self参数）
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    put_with_collider(other, self) {
        if (!this.is_put) { return }
        let is_able_to_put = false
        switch (Cube.ins.type) {
            case CubeType.SINGLE:
                is_able_to_put = this.single_check(other.node)
                break
            case CubeType.HOR:
                is_able_to_put = this.hor_check(other.node)
                break
            case CubeType.LEFT:
                is_able_to_put = this.left_check(other.node)
                break
            case CubeType.RIGHT:
                is_able_to_put = this.right_check(other.node)
                break
            default:
                break;
        }
        if (!is_able_to_put) { return }
        this.is_put = false
        let action = cc.sequence(
            cc.place(this.cube_position(other.node)),
            cc.callFunc(() => {
                // 更改数据
                GamePlay.ins.game.set_p_value(this.cube_p(other.node), Cube.ins.v)
                if (this.cube_next_p(other.node) != null) {
                    GamePlay.ins.game.set_p_value(this.cube_next_p(other.node), Cube.ins.next_v)
                }
                // 更改样式
                GameDraw.ins.change_cube_sprite(this.cube_p(other.node), Cube.ins.sf)
                if (this.cube_next_p(other.node) != null) {
                    GameDraw.ins.change_cube_sprite(this.cube_next_p(other.node), Cube.ins.next_sf)
                }
                // 回退cube
                Cube.ins.position = cc.v2(0, -400)
                Cube.ins.scale = 0
                // 合并
                /** 合并完成计数 */
                this.merge_done_count = 0
                /** 需要完成的合并计数 */
                this.merge_done_count_max = 1
                this.single_p_merge(this.cube_p(other.node))
                if (!Cube.ins.is_same && this.cube_next_p(other.node) != null) {
                    this.merge_done_count_max = 2
                    this.single_p_merge(this.cube_next_p(other.node))
                }
            }),
        )
        Cube.ins.node.runAction(action)
    }

    //////////
    // cube
    //////////

    /**
     * 获取当前cube主点的p
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    cube_p(n) {
        return n.p
    }

    /**
     * 获取当前cube副点的p
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    cube_next_p(n) {
        switch (Cube.ins.type) {
            case CubeType.SINGLE:
                return null
                break
            case CubeType.HOR:
                return this.hor_next_cube_p(n)
                break
            case CubeType.LEFT:
                return this.left_next_cube_p(n)
                break
            case CubeType.RIGHT:
                return this.right_next_cube_p(n)
                break
            default:
                break
        }
    }

    /**
     * 获取当前cube的position
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    cube_position(n) {
        switch (Cube.ins.type) {
            case CubeType.SINGLE:
                return this.single_position(n)
                break
            case CubeType.HOR:
                return this.hor_position(n)
                break
            case CubeType.LEFT:
                return this.left_position(n)
                break
            case CubeType.RIGHT:
                return this.right_position(n)
                break
            default:
                break
        }
    }

    /**
     * 根据节点获取当前cube的value
     * @param {cc.Node} n 
     * @returns {number}
     */
    cube_value(n) {
        // node.p在初始化node的时候定义（感觉并不应该这样定义）
        return GamePlay.ins.game.get_p_value(this.cube_p(n))
    }

    //////////
    // single
    //////////

    /** 
     * 检查单点是否满足条件 
     * @param {cc.Node} n
     */
    single_check(n) {
        if (this.cube_value(n) === 0) {
            return true
        } else {
            return false
        }
    }

    /**
     * 单点的enter处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    single_handle_enter(other, self) {
        if (this.single_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.on_sf)
        }
    }

    /**
     * 单点的exit处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    single_handle_exit(other, self) {
        if (this.single_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.off_sf)
        }
    }


    /**
     * 获取单点的cube移动position点
     * @param {cc.Node} n 
     */
    single_position(n) {
        return n.position.add(n.parent.position)
    }

    //////////
    // hor
    //////////

    /** 
     * 检查横向点是否满足条件 
     * @param {cc.Node} n
     */
    hor_check(n) {
        if (this.cube_value(n) === 0 && this.hor_next_cube_value(n) === 0) {
            return true
        } else {
            return false
        }
    }

    /**
     * 横向点的enter处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    hor_handle_enter(other, self) {
        if (this.hor_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.on_sf)
            GameDraw.ins.change_cube_sprite(this.hor_next_cube_p(other.node), this.on_sf)
        }
    }

    /**
     * 横向点的exit处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    hor_handle_exit(other, self) {
        if (this.hor_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.off_sf)
            GameDraw.ins.change_cube_sprite(this.hor_next_cube_p(other.node), this.off_sf)
        }
    }

    /**
     * 获取当前cube的横向next_cube的p
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    hor_next_cube_p(n) {
        if (Cube.ins.direction) {
            return n.p.add(cc.v2(0, 1))
        } else {
            return n.p.add(cc.v2(0, -1))
        }

    }

    /**
     * 根据节点获取当前cube的横向next_cube的value
     * @param {cc.Node} n 
     * @returns {number}
     */
    hor_next_cube_value(n) {
        return GamePlay.ins.game.get_p_value(this.hor_next_cube_p(n))
    }

    /**
     * 获取横向的cube移动position点
     * @param {cc.Node} n 
     */
    hor_position(n) {
        return n.position.add(cc.v2(37.5, 0)).add(n.parent.position)
    }

    //////////
    // left
    //////////

    /** 
     * 检查横向点是否满足条件 
     * @param {cc.Node} n
     */
    left_check(n) {
        if (this.cube_value(n) === 0 && this.left_next_cube_value(n) === 0) {
            return true
        } else {
            return false
        }
    }

    /**
     * 横向点的enter处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    left_handle_enter(other, self) {
        if (this.left_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.on_sf)
            GameDraw.ins.change_cube_sprite(this.left_next_cube_p(other.node), this.on_sf)
        }
    }

    /**
     * 横向点的exit处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    left_handle_exit(other, self) {
        if (this.left_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.off_sf)
            GameDraw.ins.change_cube_sprite(this.left_next_cube_p(other.node), this.off_sf)
        }
    }

    /**
     * 获取当前cube的横向next_cube的p
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    left_next_cube_p(n) {
        let add
        if (Cube.ins.direction) {
            if (n.p.x % 2 === 0) {
                add = cc.v2(1, 1)
            } else {
                add = cc.v2(1, 0)
            }
        } else {
            if (n.p.x % 2 === 0) {
                add = cc.v2(-1, 0)
            } else {
                add = cc.v2(-1, -1)
            }
        }
        return n.p.add(add)
    }

    /**
     * 根据节点获取当前cube的横向next_cube的value
     * @param {cc.Node} n 
     * @returns {number}
     */
    left_next_cube_value(n) {
        return GamePlay.ins.game.get_p_value(this.left_next_cube_p(n))
    }

    /**
     * 获取横向的cube移动position点
     * @param {cc.Node} n 
     */
    left_position(n) {
        return n.position.add(cc.v2(21.75, -36)).add(n.parent.position)
    }

    //////////
    // right
    //////////

    /** 
     * 检查横向点是否满足条件 
     * @param {cc.Node} n
     */
    right_check(n) {
        if (this.cube_value(n) === 0 && this.right_next_cube_value(n) === 0) {
            return true
        } else {
            return false
        }
    }

    /**
     * 横向点的enter处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    right_handle_enter(other, self) {
        if (this.right_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.on_sf)
            GameDraw.ins.change_cube_sprite(this.right_next_cube_p(other.node), this.on_sf)
        }
    }

    /**
     * 横向点的exit处理
     * @param {cc.Collider} other 
     * @param {cc.Collider} self 
     */
    right_handle_exit(other, self) {
        if (this.right_check(other.node)) {
            GameDraw.ins.change_cube_sprite(this.cube_p(other.node), this.off_sf)
            GameDraw.ins.change_cube_sprite(this.right_next_cube_p(other.node), this.off_sf)
        }
    }

    /**
     * 获取当前cube的横向next_cube的p
     * @param {cc.Node} n 
     * @returns {cc.Vec2}
     */
    right_next_cube_p(n) {
        let add
        if (Cube.ins.direction) {
            if (n.p.x % 2 === 0) {
                add = cc.v2(1, 0)
            } else {
                add = cc.v2(1, -1)
            }
        } else {
            if (n.p.x % 2 === 0) {
                add = cc.v2(-1, 1)
            } else {
                add = cc.v2(-1, 0)
            }
        }
        return n.p.add(add)
    }

    /**
     * 根据节点获取当前cube的横向next_cube的value
     * @param {cc.Node} n 
     * @returns {number}
     */
    right_next_cube_value(n) {
        return GamePlay.ins.game.get_p_value(this.right_next_cube_p(n))
    }

    /**
     * 获取横向的cube移动position点
     * @param {cc.Node} n 
     */
    right_position(n) {
        return n.position.add(cc.v2(-21.75, -36)).add(n.parent.position)
    }
}