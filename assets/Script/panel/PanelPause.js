import MPanel from "../framework/MPanel";
import { G } from "../framework/Global";
import GamePlay from "../gameplay/GamePlay";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
}

/**
 * Pause界面
 */
@ccclass
class PanelPause extends cc.Component {

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_continue = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_restart = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_score = null

    /** @type {cc.Node} */
    @property(cc.Node)
    btn_back = null

    onLoad() {
        /** 得到封装的UIPanel方法 */
        // this.ui = new PanelBase(this.node)
    }

    start() {
        this.set_event_continue()
        this.set_event_restart()
        this.set_event_score()
        this.set_event_back()
    }

    /** continue按钮的点击事件 */
    set_event_continue() {
        G.set_event(this.btn_continue, true, () => {
            cc.log("[点击事件]", this.name, this.btn_continue.name)
            MPanel.ins.panel_hide("PanelPause")
        })
    }

    /** restart按钮的点击事件 */
    set_event_restart() {
        G.set_event(this.btn_restart, true, () => {
            cc.log("[点击事件]", this.name, this.btn_restart.name)
            GamePlay.ins.game_restart()
            MPanel.ins.panel_hide("PanelPause")
        })
    }

    /** 结算按钮的点击事件 */
    set_event_score() {
        G.set_event(this.btn_score, true, () => {
            cc.log("[点击事件]", this.name, this.btn_score.name)
            MPanel.ins.panel_hide("PanelPause")
            MPanel.ins.panel_show("PanelScore")
        })
    }

    /** back按钮的点击事件 */
    set_event_back() {
        G.set_event(this.btn_back, true, () => {
            cc.log("[点击事件]", this.name, this.btn_back.name)
            MPanel.ins.panel_hide("PanelPause")
            MPanel.ins.panel_hide("PanelGame")
            MPanel.ins.panel_show("PanelMenu")
        })
    }
}
