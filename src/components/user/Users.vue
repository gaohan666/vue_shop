<template>
  <div>
    <!--面包屑导航-->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>用户列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!--卡片视图区-->
    <el-card class="box-card">
      <!--搜索区与添加区-->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input placeholder="请输入内容" v-model="queryInfo.query" clearable @clear="getUserList">
            <el-button slot="append" icon="el-icon-search" @click="getUserList"></el-button>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button @click="dialogVisible = true">添加用户</el-button>
        </el-col>
      </el-row>

      <!--用户列表区域-->
      <el-table :data="userlist" border stripe>
        <!--给type加个index就会变成索引列-->
        <el-table-column type="index"></el-table-column>
        <el-table-column label="姓名" prop="username" ></el-table-column>
        <el-table-column label="邮箱" prop="email" ></el-table-column>
        <el-table-column label="电话" prop="mobile" ></el-table-column>
        <el-table-column label="角色" prop="role_name" ></el-table-column>

        <el-table-column label="状态">
          <!--作用域插槽-->
          <template slot-scope="scope">
            <el-switch v-model="scope.row.mg_state" @change="userStateChange(scope.row)">
            </el-switch>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180px">
          <template slot-scope="scope">
            <!--修改-->
            <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.id)"></el-button>
            <!--删除-->
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeUserById(scope.row.id)"></el-button>
            <!--分配角色-->
            <el-tooltip class="item" effect="dark" content="分配权限" placement="top" :enterable="false">
              <el-button type="warning" icon="el-icon-setting" size="mini" @click="setRole(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!--分页区域-->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryInfo.pagenum"
        :page-sizes="[2, 4, 6, 8]"
        :page-size="queryInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </el-card>


    <!--添加用户的对话框-->
    <el-dialog
      title="添加用户"
      :visible.sync="dialogVisible"
      width="50%"
      @close="addDialogClosed">
      <!--内容主体区域-->
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="70px" class="demo-ruleForm">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" >
          <el-input v-model="addForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email"></el-input>
        </el-form-item>
        <el-form-item label="手机" prop="mobile">
          <el-input v-model="addForm.mobile"></el-input>
        </el-form-item>
      </el-form>
      <!--底部区域-->
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addUser">确 定</el-button>
      </span>
    </el-dialog>

    <!--修改用户对话框-->
    <el-dialog
      title="修改用户"
      :visible.sync="editDialogVisible"
      width="50%" @close="editDialogClosed">
      <!--内容主体区域-->
      <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="70px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email"></el-input>
        </el-form-item>
        <el-form-item label="手机" prop="mobile">
          <el-input v-model="editForm.mobile"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editUserInfo">确 定</el-button>
      </span>
    </el-dialog>

    <!--分配角色的对话框-->
    <el-dialog
      title="分配角色"
      :visible.sync="setRoleDialogVisible"
      width="50%"
      @close="setRoleDialogClosed">
      <div>
        <p>当前的用户:{{userInfo.username}}</p>
        <p>当前的角色:{{userInfo.role_name}}</p>
        <p>分配新角色：
          <el-select v-model="selectedRoleId">
            <el-option
              v-for="item in roleslist"
              :key="item.id"
              :label="item.roleName"
              :value="item.id">
            </el-option>
          </el-select>
        </p>
      </div>
      <span slot="footer" class="dialog-footer">
          <el-button @click="setRoleDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="saveRoleInfo">确 定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
  export default {
    data() {

      //验证邮箱的规则
      var checkEmail = (rule,value,cb) => {
        //邮箱的正则
        const regEmail = /^\w+@\w+(\.\w+)+$/

        if (regEmail.test(value)) {
          //合法的邮箱
          return cb()
        }
        //返回一个错误提示
        cb(new Error('请输入合法的邮箱'))
      }

      // 验证手机号的规则
      var checkMobile = (rule,value,cb) => {

        const regMobile = /^1[34578]\d{9}$/
        if (regMobile.test(value)) {
          return cb()
        }
        //返回一个错误提示
        cb(new Error('请输入合法的手机号码'))
      }

      return {

        //获取用户列表的参数
        queryInfo: {
          query: '',
          //当前的页数
          pagenum: 1,
          // 当前页数显示多少条信息
          pagesize: 2
        },
        userlist: [],
        total: 0,
        // 控制添加用户对话框的显示与隐藏
        dialogVisible: false,
        // 控制修改用户对话框的显示与隐藏
        editDialogVisible: false,
        // 添加用户的表单数据
        addForm: {
          username: '',
          password: '',
          email: '',
          mobile: ''
        },
        // 添加表单的验证规则对象
        addFormRules: {
          username: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
          ],
          password: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 6, max: 15, message: '长度在 6 到 15 个字符', trigger: 'blur' }
          ],
          email: [
            { required: true, message: '请输入邮箱', trigger: 'blur' },
            { validator: checkEmail, trigger: 'blur'}
          ],
          mobile: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { validator: checkMobile, trigger: 'blur'}
          ]
        },
        // 查询到的用户信息对象
        editForm: {},
        // 修改表单的验证规则
        editFormRules: {
          email: [
            { required: true, message: '请输入邮箱', trigger: 'blur' },
            { validator: checkEmail, trigger: 'blur'}
          ],
          mobile: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { validator: checkMobile, trigger: 'blur'}
          ]
        },
        // 控制修改权限对话框的显示与隐藏
        setRoleDialogVisible: false,
        // 需要被分配角色的用户信息
        userInfo: {},
        //所有角色的数据列表
        roleslist: [],
        // 你选择的角色id值
        selectedRoleId: ''
      }
    },
    created () {
      this.getUserList()
    },
    methods: {
      async getUserList () {
        //解构一个data属性，重命名为res
        const {data: res} = await this.$http.get('users',{params: this.queryInfo})
        if (res.meta.status !== 200) {
          return this.$message.error('获取用户列表失败')
        }
        this.userlist = res.data.users
        this.total = res.data.total
      },
      // 监听pageSize改变的事件
      handleSizeChange (newSize) {
        this.queryInfo.pagesize = newSize
        this.getUserList()
      },

      // 监听页码值改变的事件
      handleCurrentChange (newPage) {
        this.queryInfo.pagenum = newPage
        this.getUserList()
      },
      // 监听switch状态的改变
      async userStateChange (userInfo) {
        const {data:res} = await this.$http.put(`users/${userInfo.id}/state/${userInfo.mg_state}`)
        if (res.meta.status !== 200) {
          // 失败的话，重置状态
          userInfo.mg_state = !userInfo.mg_state
          return this.$message.error('更新用户状态失败！')
        }
        this.$message.success('更新用户状态成功')
      },
      // 监听添加用户对话框的关闭事件
      addDialogClosed () {
        // 重置表单，先找到表单的引用
        this.$refs.addFormRef.resetFields()
      },
      // 点击按钮，添加用户
      addUser () {
        // 提交前先校验
        this.$refs.addFormRef.validate(async valid => {
          // 校验不通过
          if (!valid) return
          // 可以发起添加用户的网络请求
          const {data:res} = await this.$http.post('users',this.addForm)
          if (res.meta.status != 201) {
            this.$message.error('添加用户失败')
          }
          this.$message.success('添加用户成功')
          // 隐藏添加对话框
          this.dialogVisible = false
          //刷新用户列表
          this.getUserList()
        })
      },
      // 展示编辑用户的对话框
      async showEditDialog (id) {
        const {data:res} = await this.$http.get('users/' + id)
        if (res.meta.status !== 200) {
          return this.$message.error('查询用户信息失败')
        }
        console.log(res)
        this.editDialogVisible = true
        this.editForm = res.data
      },
      // 监听修改用户对话框的关闭事件
      editDialogClosed () {
        this.$refs.editFormRef.resetFields()
      },
      // 修改用户信息并提交
      editUserInfo () {
        // 提交前先校验
        this.$refs.editFormRef.validate(async valid => {
          // 校验不通过
          if (!valid) return
          // 可以发起添加用户的网络请求
          const {data:res} = await this.$http.put('users/' + this.editForm.id ,
            {email: this.editForm.email,
                  mobile: this.editForm.mobile})
          if (res.meta.status != 200) {
            this.$message.error('修改用户失败')
          }
          this.$message.success('修改用户成功')
          // 隐藏添加对话框
          this.editDialogVisible = false
          //刷新用户列表
          this.getUserList()
        })
      },
      // 根据id删除对应的用户信息
      async removeUserById (id) {

        console.log(id)
        // 弹框询问是否删除
        const confirmResult = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(err => {
          return err
        })

        //如果用户确认删除，返回值为字符串confirm
        //如果用户取消删除，返回值为字符串cancel
        if (confirmResult != 'confirm') {
          return this.$message.info('已经取消删除')
        }

        const {data:res} = await this.$http.delete('users/' + id)
        if (res.meta.status !== 200) {
          this.$message.error('删除用户失败')
        }
        this.$message.success('删除用户成功')
        this.getUserList()
      },

      //展示分配角色对话框
      async setRole (userInfo) {
        this.userInfo = userInfo
        //在展示对话框之前，获取所有角色列表
        const {data:res} = await this.$http.get('roles')
        console.log(res)
        if (res.meta.status !== 200) {
          return this.$message.error('获取列表失败')
        }

        this.roleslist = res.data

        this.setRoleDialogVisible = true
      },

      // 保存分配的角色信息
      async saveRoleInfo () {
        if (!this.selectedRoleId) {
          this.$message.error('没有选择角色id')
        }

        const {data:res} = await this.$http.put(`users/${this.userInfo.id}/role`,{rid:this.selectedRoleId})
        if (res.meta.status !== 200) {
          this.$message.error('分配用户角色失败')
        }
        this.$message.success('分配用户角色成功')

        this.getUserList()
        this.setRoleDialogVisible = false

      },
      setRoleDialogClosed () {
        this.selectedRoleId = ''
      }
    }
  }
</script>

<style scoped>

</style>
