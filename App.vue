<script>
export default {
  data() {
    return {
      isCheckingPrivacy: false
    }
  },
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-3gdifj153bd208e6',
      traceUser: true
    })
  },
  onShow() {
    this.checkAndOpenPrivacyPage()
  },
  methods: {
    checkAndOpenPrivacyPage() {
      if (this.isCheckingPrivacy) return

      const agreed = wx.getStorageSync('privacyAgreed') === true
      if (agreed) return

      const pages = getCurrentPages()
      const currentRoute = pages.length ? pages[pages.length - 1].route : ''
      if (currentRoute === 'pages/privacy-modal/index') return

      this.isCheckingPrivacy = true
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/privacy-modal/index',
          complete: () => {
            this.isCheckingPrivacy = false
          }
        })
      }, 120)
    }
  }
}
</script>

<style>
page {
  background-color: #F5F6FA;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  box-sizing: border-box;
}
</style>
