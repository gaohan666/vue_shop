import Vue from 'vue'
import { Button, FormItem, Input, Form, Message } from 'element-ui'

Vue.use(Button)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Input)
// 把弹框组件挂载到vue原型上
Vue.prototype.$message = Message
