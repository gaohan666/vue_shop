<template>
  <div>
    <!--面包屑导航-->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!--卡片视图区-->
    <el-card class="box-card">

      <!--添加角色区-->
      <el-row :gutter="20">
        <el-col :span="4">
          <el-button type="primary" @click="dialogVisible = true">添加用户</el-button>
        </el-col>
      </el-row>

      <!--角色列表区域-->
      <el-table :data="roleslist" border stripe>
        <!--展开列-->
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-row :class="['bdbottom',i1 ===0 ? 'bdtop' : '','vcenter']" v-for="(item1,i1) in scope.row.children" :key="item1.id" >
              <!--渲染一级权限-->
              <el-col :span="5">
                <el-tag closable @close="removeRightById(scope.row,item1.id)">{{item1.authName}}</el-tag>
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!--渲染二级和三级权限-->
              <el-col :span="19">
                <!--通过for循环，嵌套渲染二级权限-->
                <el-row :class="[i2 === 0 ? '' : 'bdtop','vcenter']" v-for="(item2,i2) in item1.children" :key="item2.id">
                  <el-col :span="6">
                    <el-tag type="success" closable @close="removeRightById(scope.row,item2.id)">{{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">
                    <el-tag v-for="(item3,i3) in item2.children" :key="item3.id" type="warning" closable @close="removeRightById(scope.row,item3.id)">{{item3.authName}}</el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>

        </el-table-column>
        <!--给type加个index就会变成索引列-->
        <el-table-column type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName" ></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc" ></el-table-column>
        <el-table-column label="操作">
          <temolate slot-scope="scope">
            <!--修改-->
            <el-button type="primary" icon="el-icon-edit"  @click="showEditDialog(scope.row.id)" size="mini">编辑</el-button>
            <!--删除-->
            <el-button type="danger" icon="el-icon-delete" @click="removeUserById(scope.row.id)" size="mini">删除</el-button>
            <!--分配权限-->
            <el-button type="warning" icon="el-icon-setting" size="mini" @click="showSetRightDialog(scope.row)">分配权限</el-button>
          </temolate>
        </el-table-column>

      </el-table>

      <!--分配权限的对话框-->
      <el-dialog
        title="分配权限"
        :visible.sync="setRightDialogVisible"
        width="50%"
        @close="setRightDialogClosed">
        <el-tree :data="rightslist" :props="treeProps" show-checkbox node-key="id" default-expand-all
                 :default-checked-keys="defKeys" ref="treeRef"></el-tree>
        <span slot="footer" class="dialog-footer">
          <el-button @click="setRightDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="allotRights">确 定</el-button>
        </span>
      </el-dialog>


    </el-card>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        roleslist: [],
        // 控制 分配权限对话框 的 显示与隐藏
        setRightDialogVisible: false,
        rightslist: [],
        // 树形控件的属性绑定对象
        treeProps: {
          label: 'authName',
          children: 'children'
        },
        // 默认选中节点的id值数组
        defKeys: [],
        // 当前即将分配角色的权限id
        roleId: '',
      }
    },
    created () {
      this.getRolesList()
    },
    methods: {
      async getRolesList () {
        //解构一个data属性，重命名为res
        const {data: res} = await this.$http.get('roles')
        if (res.meta.status !== 200) {
          return this.$message.error('获取用户列表失败')
        }
        this.roleslist = res.data
      },
      //根据id删除对应的权限
      async removeRightById (role,rightId) {
        //弹框提示用户是否要删除
        const confirmesult = await this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).catch(err => {
          // 返回的错误是promise
          return err
        })

        if (confirmesult !== 'confirm') {
          return this.$message.info('取消了删除')
        }

        const {data:res} = await this.$http.delete(`roles/${role.id}/rights/${rightId}`)

        if (res.meta.status !== 200) {
          this.$message.error('删除权限失败')
        }

        this.$message.success('删除权限成功')
        role.children = res.data

      },
      //展示分配权限的对话框
      async showSetRightDialog (role) {
        this.roleId = role.id

        //获取所有权限的数据
        const {data:res} = await this.$http.get('rights/tree')
        if (res.meta.status !== 200) {
          return this.$message.error('获取权限数据失败')
        }
        //把获取到权限数据保存
        this.rightslist = res.data

        // 递归获取三级节点的id
        this.getLeafKeys(role,this.defKeys)

        this.setRightDialogVisible = true
      },
      // 通过递归的形式，获取角色下所有三级权限的id，并保存到 defKeys 数组中
      getLeafKeys(node, arr) {
        // 如果当前 node 节点不包含 children 属性，则是三级节点
        if (!node.children) {
          return arr.push(node.id)
        }

        node.children.forEach(item => this.getLeafKeys(item,arr))
      },

      // 监听分配权限对话框的关闭事件
      setRightDialogClosed () {
        this.defKeys = []
      },

      //点击为角色分配权限
      async allotRights () {
        const keys = [
          ...this.$refs.treeRef.getCheckedKeys(),
          ...this.$refs.treeRef.getHalfCheckedKeys()
        ]

        const idStr = keys.join(',')

        const { data: res } = await this.$http.post(
          `roles/${this.roleId}/rights`,
          { rids: idStr }
        )

        if (res.meta.status !== 200) {
          return this.$message.error('分配权限失败！')
        }

        this.$message.success('分配权限成功！')
        this.getRolesList()
        this.setRightDialogVisible = false
      }
    }
  }
</script>

<style scoped>
.el-tag{
  margin: 7px;
}

.bdtop{
  border-top: 1px solid #eeeeee;
}

.bdbottom{
  border-bottom: 1px solid #eeeeee;
}

.vcenter{
  display: flex;
  align-items: center;
}
</style>
