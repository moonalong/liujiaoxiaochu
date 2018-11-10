import MPanel from "../framework/MPanel";
import { G } from "../framework/Global";
import GamePlay from "../gameplay/GamePlay";
import { L } from "../framework/LocalData";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
    /** 旋转一圈的时间 */
    CIRCLE_TIME: 15,
}

/**
 * 游戏界面
 */
@ccclass
export default class PanelGame extends cc.Component {

    /** @type {PanelGame} */
    static ins

    /** @type {cc.Node} cube的背景圆圈 */
    @property(cc.Node)
    circle = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_pause = null

    /** @type {cc.Label} 分数label */
    @property(cc.Label)
    score_label = null

    /** @type {cc.Label} 最高分数label */
    @property(cc.Label)
    max_score_label = null

    /** @type {cc.Node} 道具-换一换 */
    @property(cc.Node)
    btn_change = null

    /** @type {cc.Node} 道具-单点消除 */
    @property(cc.Node)
    btn_remove = null

    /** @type {cc.Label} 道具次数label */
    @property(cc.Label)
    change_count_label = null

    /** @type {cc.Label} 道具次数label */
    @property(cc.Label)
    remove_count_label = null


    onLoad() {
        /** 得到封装的UIPanel方法 */
        // this.ui = new PanelBase(this.node)

        this.is_first = true

        this.set_circle_rotation()
        this.set_event_pause()
        this.set_event_change()
        this.set_event_remove()

        PanelGame.ins = this
    }

    onEnable() {
        if (this.is_first) {
            this.is_first = false
            return
        } else {
            this.update_score()
            GamePlay.ins.game_restart()
        }
    }

    /** 更新两个score信息 */
    update_score() {
        this.score_label.string = GamePlay.ins.score
        // 更改最高分
        if (GamePlay.ins.score > L.max_score) {
            L.max_score = GamePlay.ins.score
        }
        this.max_score_label.string = L.max_score
    }

    /** 更新换一换次数 */
    update_prop_change_count() {
        this.change_count_label.string = GamePlay.ins.prop_change_count
    }

    /** 更新remove次数 */
    update_prop_remove_count() {
        this.remove_count_label.string = GamePlay.ins.prop_remove_count
    }

    /** 设置旋转 */
    set_circle_rotation() {
        let action = cc.rotateBy(C.CIRCLE_TIME, 360).repeatForever()
        this.circle.runAction(action)
    }

    /** pause按钮的点击事件 */
    set_event_pause() {
        G.set_event(this.btn_pause, true, () => {
            cc.log("[点击事件]", this.name, this.btn_pause.name)
            MPanel.ins.panel_show("PanelPause")
        })
    }

    /** change按钮的点击事件 */
    set_event_change() {
        G.set_event(this.btn_change, true, () => {
            cc.log("[点击事件]", this.name, this.btn_change.name)
            GamePlay.ins.prop_change()
        })
    }
    /** remove按钮的点击事件 */
    set_event_remove() {
        G.set_event(this.btn_remove, true, () => {
            cc.log("[点击事件]", this.name, this.btn_remove.name)
            GamePlay.ins.prop_remove()
        })
    }
}
