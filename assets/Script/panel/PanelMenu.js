import MPanel from "../framework/MPanel";
import { G } from "../framework/Global";
import GamePlay from "../gameplay/GamePlay";

const { ccclass, property } = cc._decorator

/** 配置参数 */
const C = {
    /** 旋转一圈的时间 */
    CIRCLE_TIME: 15,
}

/**
 * Menu界面
 */
@ccclass
class PanelMenu extends cc.Component {

    /** @type {cc.Node} start_btn */
    @property(cc.Node)
    start_btn = null

    /** @type {cc.Node} rank_btn */
    @property(cc.Node)
    rank_btn = null

    onLoad() {
        /** 得到封装的UIPanel方法 */
        // this.ui = new PanelBase(this.node)
    }

    start() {
        this.set_event_start()
    }

    /** 开始按钮的点击处理 */
    set_event_start() {
        G.set_event(this.start_btn, true, () => {
            cc.log("[点击事件]", this.name, this.start_btn.name)
            MPanel.ins.panel_hide("PanelMenu")
            MPanel.ins.panel_show("PanelGame")
        })
    }
}
