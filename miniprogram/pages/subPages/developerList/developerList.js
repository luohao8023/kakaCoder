/**
 * @name: 开发者列表，相比trending页面稍微简化
 * @author: haoluo2
 * @date: 2020-03-12
*/
import request from '../../../utils/request.js';
import utils from '../../../utils/util.js';
Page({
    data: {
        developerList: [],
        page: 1,
        hasNextPage: true,
        pageSize: 15,
        load: false,
        refresh: false,
        // 调用云函数的type
        funcType: '',
        // 调用云函数的参数
        param: {}
    },
    onLoad(option) {
        this.data.funcType = option.funcType;
        this.data.param = JSON.parse(option.param);
        this.init();
    },
    onShow() {
        // 跨页面设置fresh
        if (this.data.refresh) this.init();
    },
    init() {
        this.data.page = 1;
        this.data.hasNextPage = true;
        if (this.data.refresh) {
            // refresh为true时，是为了避免页面栈溢出，回退到此页面，需要刷新数据
            this.setData({
                developerList: []
            });
            this.data.refresh = false;
        }
        this.getDeveloperList();
    },
    // 下拉刷新
    onPullDownRefresh() {
        wx.stopPullDownRefresh();
        this.init();
    },
    // 上拉加载
    onReachBottom() {
        this.getDeveloperList();
    },
    // 获取开发者列表
    getDeveloperList() {
        if (!this.data.funcType) return;
        if (!this.data.hasNextPage) return;
        const { funcType, param } = this.data;
        utils.showLoading();
        request.cloud(funcType, Object.assign({}, param, {
            per_page: this.data.pageSize,
            page: this.data.page
        })).then(res => {
            utils.hideLoading();
            let data = res.data;
            if (!data || !(data instanceof Array)) data = [];
            this.setData({
                developerList: [...this.data.developerList, ...data],
                hasNextPage: data.length === this.data.pageSize
            });
            this.data.page++;
        }).catch(err => {
            utils.showTip(err);
        }).finally(() => {
            this.setData({
                load: true
            });
        });
    },
    // 查看开发者
    viewDeveloperDetail(e) {
        const { name } = e.currentTarget.dataset;
        // 目标页面路由
        const targetPageRoute = '/pages/subPages/developer/developer';
        // 查看页面栈，如果页面栈中已存在目标页面，则使用navigateBackTo的方式跳转，防止循环跳转，页面栈溢出
        let allPages =  getCurrentPages();
        const index = allPages.findIndex(item => targetPageRoute.indexOf(item.route) >= 0);
        if (index < 0) {
            // 页面栈中不存在，则正常跳转
            wx.navigateTo({
                url: `${targetPageRoute}?username=${name}`
            });
        } else {
            // 如果存在目标页面，则使用返回的方式跳转，并手动设置该页面的参数
            // 这时候就是该页面在onShow中调用初始化方法原因了
            // 目标页面对象
            const targetPageObj = allPages[index];
            // 按照各个页面参数的格式进行设置，有点麻烦，但为了避免页面栈溢出，还是得想办法处理的
            targetPageObj.data.username = name;
            targetPageObj.data.refresh = true;
            wx.navigateBack({
                delta: allPages.length - index - 1
            });
        }
    }
});