const { ccclass, property } = cc._decorator

/**
 * 微信开放数据域
 */
@ccclass
class WxOpenData extends cc.Component {
    /** opendata的绘制域 */
    @property(cc.Sprite)
    open_data_display = null

    start() {
        this.tex = new cc.Texture2D()
        let shared_canvas = wx.getOpenDataContext().canvas
        this.tex.initWithElement(shared_canvas)
        this.tex.handleLoadedTexture()
        this.open_data_display.spriteFrame = new cc.SpriteFrame(this.tex)
    }
}