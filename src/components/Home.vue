<template>
  <el-container class="home_container">
    <!--头部区域-->
    <el-header>
      <img src="../assets/heima.png" alt="">
      <span>电商后台管理系统</span>
      <el-button type="info" @click="logout">退出</el-button>
    </el-header>
    <!--页面主题区域-->
    <el-container>
      <!--侧边栏-->
      <el-aside :width="isCollapse ? '64px' : '200px'">
        <div class="toggle-button" @click="toggleCollapse">|||</div>
        <!--侧边栏菜单效果-->
        <el-menu
          background-color="#E4F5EF"
          text-color="#2C3E50"
          active-text-color="#03C2E6"
          unique-opened
          :collapse="isCollapse"
          :collapse-transition="false"
          :router="true"
          :default-active="activePath">
          <!--一级菜单-->
          <el-submenu :index="item.id + ''" v-for="item in menulist" :key="item.id">
            <!--一级菜单的模板区域-->
            <template slot="title">
              <!--图标-->
              <i :class="iconsObj[item.id]"></i>
              <!--文本-->
              <span>{{item.authName}}</span>
            </template>

            <!--二级菜单-->
            <el-menu-item :index="'/' + subItem.path" v-for="subItem in item.children" :key="subItem.id"
            @click="saveNavState('/' + subItem.path)">
              <template slot="title">
                <!--图标-->
                <i class="el-icon-menu"></i>
                <!--文本-->
                <span>{{subItem.authName}}</span>
              </template>
            </el-menu-item>

          </el-submenu>

        </el-menu>

      </el-aside>
      <!--右侧内容主题-->
      <el-main>
        <!--放一个路由占位符-->
        <router-view></router-view>
      </el-main>
    </el-container>

  </el-container>
</template>

<script>
  export default {
    data() {
      return {
        //左侧菜单数据
        menulist: [],
        iconsObj: {
          '125': 'el-icon-user-solid',
          '103': 'el-icon-apple',
          '101': 'el-icon-s-goods',
          '102': 'el-icon-s-order',
          '145': 'el-icon-s-marketing'
        },
        isCollapse: false,
        activePath: ''
      }
    },
    //Home 组件刚创建时会执行这个生命周期函数,还有Home页面刷新的时候
    created () {
      this.getMenuList()
      this.activePath = window.sessionStorage.getItem('activePath')
    },
    methods: {
      logout () {
        window.sessionStorage.clear();
        this.$router.push('/login');
      },
      //获取所有的菜单
      async getMenuList() {
        const {data: res} = await this.$http.get('menus')
        if(res.meta.status !== 200) return this.$message.error(res.meta.msg)
        this.menulist = res.data
      },
      // 点击按钮，切换菜单的折叠与展开
      toggleCollapse () {
        this.isCollapse = !this.isCollapse
      },
      //保存链接的激活状态
      saveNavState (activePath) {
        window.sessionStorage.setItem('activePath',activePath)
        this.activePath = activePath
      }
    }
  }
</script>

<style scoped>
.home_container{
  height: 100%;
}
.el-header{
  background-color: #BBE6D6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
}
.el-aside{
  background-color: #E4F5EF;
  .el-menu{
    /*优化menu的边框线*/
    border-right: none;
  }
}
.el-main{
  background-color: #FFFFFF;
}

.toggle-button{
  background-color: #C8EBDF;
  text-align: center;
  font-size: 15px;
  line-height: 24px;
  color: #2b4b6b;
  letter-spacing: 0.2em;
  cursor: pointer;
}
</style>
