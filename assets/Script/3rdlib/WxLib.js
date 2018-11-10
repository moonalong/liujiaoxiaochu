class WxLib {
    test() {
        wx.login({
            success: function () {
                cc.log(1111111111)
                wx.getUserInfo()
            }
        })
    }
}

export let WX = new WxLib()