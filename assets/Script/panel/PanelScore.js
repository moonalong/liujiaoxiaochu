import MPanel from "../framework/MPanel";
import { G } from "../framework/Global";
import GamePlay from "../gameplay/GamePlay";
import { L } from "../framework/LocalData";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {

}

/**
 * Score界面
 */
@ccclass
class PanelScore extends cc.Component {

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_restart = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_back = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_share = null

    /** @type {cc.Label} 分数label */
    @property(cc.Label)
    score_label = null

    /** @type {cc.Label} 最高分数label */
    @property(cc.Label)
    max_score_label = null

    onLoad() {
        /** 得到封装的UIPanel方法 */
        // this.ui = new PanelBase(this.node)

        this.set_event_restart()
        this.set_event_back()
        this.set_event_share()

        this.is_first = true
    }

    onEnable() {
        if (this.is_first) {
            this.is_first = false
            return
        }
        this.update_score()
    }

    /** 更新两个分数 */
    update_score() {
        this.score_label.string = GamePlay.ins.score
        this.max_score_label.string = L.max_score
    }

    /** restart按钮的点击事件 */
    set_event_restart() {
        G.set_event(this.btn_restart, true, () => {
            cc.log("[点击事件]", this.name, this.btn_restart.name)
            GamePlay.ins.game_restart()
            MPanel.ins.panel_hide("PanelScore")
        })
    }

    /** back按钮的点击事件 */
    set_event_back() {
        G.set_event(this.btn_back, true, () => {
            cc.log("[点击事件]", this.name, this.btn_back.name)
            MPanel.ins.panel_hide("PanelScore")
            MPanel.ins.panel_hide("PanelGame")
            MPanel.ins.panel_show("PanelMenu")
        })
    }

    /** share按钮的点击事件 */
    set_event_share() {
        G.set_event(this.btn_share, true, () => {
            cc.log("[点击事件]", this.name, this.btn_share.name)
        })
    }
}