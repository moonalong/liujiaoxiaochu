import { CubeType } from "./Cube";

/** 配置参数 */
const C = {
    // 特别注意，数组下标与传统坐标不同
    /** -1,-1 */
    V_UP_LEFT: cc.v2(-1, -1),
    /** -1,0 */
    V_UP_MID: cc.v2(-1, 0),
    /** -1,1 */
    V_UP_RIGHT: cc.v2(-1, 1),
    /** 0,-1 */
    V_LEFT: cc.v2(0, -1),
    /** 0,1 */
    V_RIGHT: cc.v2(0, 1),
    /** 1,-1 */
    V_DOWN_LEFT: cc.v2(1, -1),
    /** 1,0 */
    V_DOWN_MID: cc.v2(1, 0),
    /** 1,1 */
    V_DOWN_RIGHT: cc.v2(1, 1),
}

/**
 * gameplay：游戏数据类
 * @class
 */
export default class Game {

    /** 构造函数 */
    constructor() {
        /** 
         * 地图数据（二维数组）
         * - -1为不存在
         * - 0为空
         * - 1~n为n种cube
         */
        this.map_array = Array.of()

        /**
         * 每一小块存储数据（二维数组）
         * - 第0行固定为空
         */
        this.kind_array = Array.of()

        /** 起始地图的数据 */
        this.start_map_arraylike = {
            "0": [-1, 0, 0, 0, 0, -1, -1],
            "1": [-1, 0, 0, 0, 0, 0, -1],
            "2": [0, 0, 0, 0, 0, 0, -1],
            "3": [0, 0, 0, 0, 0, 0, 0],
            "4": [0, 0, 0, 0, 0, 0, -1],
            "5": [-1, 0, 0, 0, 0, 0, -1],
            "6": [-1, 0, 0, 0, 0, -1, -1],
            "length": 7,
        }
        /** 测试地图的数据 */
        this.test_map_arraylike = {
            "0": [-1, 0, 1, 0, 0, -1, -1],
            "1": [-1, 0, 1, 0, 0, 0, -1],
            "2": [0, 0, 1, 1, 0, 0, -1],
            "3": [0, 0, 1, 1, 1, 0, 0],
            "4": [0, 0, 1, 1, 0, 0, -1],
            "5": [-1, 0, 0, 0, 0, 0, -1],
            "6": [-1, 0, 0, 0, 0, -1, -1],
            "length": 7,
        }
    }

    /** 初始化游戏数据 */
    init() {
        // 初始化地图数据
        // this.map_array = Array.from(this.start_map_like)
        // this.map_array = Array.from(this.test_map_arraylike)
        ///! bug：在Array.from()的时候，如果arraylike的每一项是数组，则数组指向不变，任何操作都会操作相同的数组

        this.map_array.length = 0
        for (let i = 0; i < this.start_map_arraylike.length; i++) {
            this.map_array.push(Array.from(this.start_map_arraylike[i.toString()]))
        }
        // for (let i = 0; i < this.test_map_arraylike.length; i++) {
        //     this.map_array.push(Array.from(this.test_map_arraylike[i.toString()]))
        // }

        // 初始化存储数据
        this.kind_array.length = this.map_array.length
        this.kind_array.fill(null)
        for (let x = 0; x < this.map_array.length; x++) {
            for (let y = 0; y < this.map_array[x].length; y++) {
                /** 当前点的value */
                let v = this.get_p_value(cc.v2(x, y))
                // 判定空数据
                if (v === 0) { continue }
                if (v === -1) { continue }
                // 写入非空数据
                if (this.kind_array[v] === null) {
                    this.kind_array[v] = Array.of()
                }
                this.kind_array[v].push(cc.v2(x, y))
            }
        }
    }

    /** 
     * 获取enemy位置的可行type
     * @returns {Set} 
     */
    empty_type() {
        let type_set = new Set()
        for (let x = 0; x < this.map_array.length; x++) {
            for (let y = 0; y < this.map_array[x].length; y++) {
                let p = cc.v2(x, y)
                if (!this.is_p_empty(p)) { continue }
                if (this.empty_type_has_single(p)) { type_set.add(CubeType.SINGLE) }
                if (this.empty_type_has_hor(p)) { type_set.add(CubeType.HOR) }
                if (this.empty_type_has_left(p)) { type_set.add(CubeType.LEFT) }
                if (this.empty_type_has_right(p)) { type_set.add(CubeType.RIGHT) }
                if (type_set.size === 4) { return type_set }
            }
        }
        return type_set
    }

    /** 
     * 获取empty位置的可行value 
     * @returns {Set}
     */
    empty_value() {
        let value_set = new Set()
        for (let x = 0; x < this.map_array.length; x++) {
            for (let y = 0; y < this.map_array[x].length; y++) {
                let p = cc.v2(x, y)
                value_set.add(this.get_p_value(p))
                if (value_set.size === 8) {
                    // 注意会写入-1和0
                    value_set.delete(-1)
                    value_set.delete(0)
                    return value_set
                }
            }
        }
        value_set.delete(-1)
        value_set.delete(0)
        // 注意要放入1和2（默认值）
        value_set.add(1)
        value_set.add(2)
        return value_set
    }

    /**
     * 检测当前点是否具有single形状
     * @param {cc.Vec2} p 
     */
    empty_type_has_single(p) {
        return true
    }

    /**
     * 检测当前点是否具有hor形状
     * @param {cc.Vec2} p 
     */
    empty_type_has_hor(p) {
        let next_p = p.add(C.V_LEFT)
        return this.is_p_empty(next_p)
    }

    /**
     * 检测当前点是否具有left形状
     * @param {cc.Vec2} p 
     */
    empty_type_has_left(p) {
        let next_p
        if (p.x % 2 === 1) {
            next_p = p.add(C.V_UP_LEFT)
        } else {
            next_p = p.add(C.V_UP_MID)
        }
        return this.is_p_empty(next_p)
    }

    /**
     * 检测当前点是否具有right形状
     * @param {cc.Vec2} p 
     */
    empty_type_has_right(p) {
        let next_p
        if (p.x % 2 === 1) {
            next_p = p.add(C.V_UP_MID)
        } else {
            next_p = p.add(C.V_UP_RIGHT)
        }
        return this.is_p_empty(next_p)
    }

    /**
     * 检测某个点是否为空
     * @param {cc.Vec2} p 
     */
    is_p_empty(p) {
        if (this.get_p_value(p) === 0) { return true }
        return false
    }

    /** 
     * 设置点的值
     * - 注意封装点坐标溢出
     * @param {cc.Vec2} p
     * @param {number} value
     */
    set_p_value(p, value) {
        try {
            this.map_array[p.x][p.y] = value
        } catch (error) {

        }
    }

    /** 
     * 获取点的值
     * - 注意封装点坐标溢出
     * @param {cc.Vec2} p
     * @returns {number}
     */
    get_p_value(p) {
        let r
        try {
            r = this.map_array[p.x][p.y]
        } catch (error) {
            r = -1
        }
        return r
    }

    /**
     * 获取点p的可合并点（并不处理数据）
     * - 1024规则
     * @param {cc.Vec2} p 
     * @returns {[]} 需要合并的点集合（cc.Vec2）
     */
    merge(p) {
        // 判定不可合并状态
        if (this.get_p_value(p) === 0) { return }

        // 计算可合并点
        /** 可以合并的点set */
        let m_set = new Set()
        /** 新增的点set */
        let m_add_set = new Set()
        // 递归计算m_set
        // 注意使用尾递归优化，减少内存占用
        m_add_set.add(this.p_trans_string(p))
        m_set = this.merge_recursive(this.get_p_value(p), m_set, m_add_set)
        // 去掉起始点
        m_set.delete(this.p_trans_string(p))

        // 小于2则直接返回
        if (m_set.size < 2) { return }

        // 返回值转化
        let m_array = Array.of()
        m_set.forEach((v) => {
            m_array.push(this.p_untrans_string(v))
        })

        return m_array
    }

    /**
     * 合并数据
     * @param {*} p 主点
     * @param {*} m_array 被合并点数组
     */
    merge_data(p, m_array) {
        m_array.forEach(v => {
            this.set_p_value(v, 0)
        })
        this.set_p_value(p, this.get_p_value(p) + 1)
    }

    /** 合并点周围的所有点-获取点 */
    merge_around(p) {
        let m_array = this.p_around(p)
        return m_array
    }

    /** 合并点周围的所有点-更改数据 */
    merge_around_data(p, m_array) {
        this.merge_data(p, m_array)
        // 设置中心点为0
        this.set_p_value(p, 0)
    }

    /**
     * 递归计算m_set
     * - 内部数据使用string存储，因为每个object在set中都不相等，无法做到set内去重
     * @param {number} value 
     * @param {Set} m_set 
     * @param {Set} m_add_set 
     */
    merge_recursive(value, m_set, m_add_set) {
        // 清理m_add_set（差集）
        m_add_set = new Set([...m_add_set].filter(x => !m_set.has(x)))
        // 判定结束递归
        if (m_add_set.size === 0) {
            return m_set
        }
        // 写入m_set（并集）
        m_set = new Set([...m_set, ...m_add_set])
        // 计算新的m_add_set
        let new_set = new Set()
        m_add_set.forEach((v) => {
            let p = this.p_untrans_string(v)
            let add_p = this.p_around(p)
            for (let new_p of add_p) {
                if (this.get_p_value(new_p) === value) {
                    new_set.add(this.p_trans_string(new_p))
                }
            }
        })
        m_add_set = new_set
        // 递归
        return this.merge_recursive(value, m_set, m_add_set)
    }

    /**
     * 获取点p周围的点
     * - 需要分奇数行和偶数行（注意从第0行开始算）
     * @param {cc.Vec2} p 
     * @returns {[cc.Vec2]}
     */
    p_around(p) {
        let p0, p1, p2, p3, p4, p5
        if (p.x % 2 === 1) {
            p0 = p.add(C.V_UP_LEFT)
            p1 = p.add(C.V_DOWN_LEFT)
        } else {
            p0 = p.add(C.V_UP_RIGHT)
            p1 = p.add(C.V_DOWN_RIGHT)
        }
        p2 = p.add(C.V_UP_MID)
        p3 = p.add(C.V_LEFT)
        p4 = p.add(C.V_RIGHT)
        p5 = p.add(C.V_DOWN_MID)
        let around_array = Array.of(p0, p1, p2, p3, p4, p5)
        return around_array
    }

    /**
     * 点p的坐标转换为string
     * @param {cc.Vec2} p 
     * @returns {string}
     */
    p_trans_string(p) {
        return p.x.toString() + p.y.toString()
    }

    /**
     * string转换为点p的坐标
     * @param {string} p_string 
     * @returns {cc.Vec2}
     */
    p_untrans_string(p_string) {
        let v = Array.of(...p_string)
        let v2 = cc.v2(Number.parseInt(v[0]), Number.parseInt(v[1]))
        return v2
    }
}