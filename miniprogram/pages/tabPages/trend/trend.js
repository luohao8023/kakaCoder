/**
 * @name: Trending
 * @author: haoluo2
 * @date: 2020-03-05
*/

import utils from '../../../utils/util.js';
import CONST from '../../../utils/const.js';
// async await
const regeneratorRuntime = require('../../../utils/regenerator-runtime.js');
Page({
    data: {
        currentTab: 'repo',//dev
        repoList: [],
        developerList: [],
        pickerList: [],
        languageList: [],
        spokenLanguageList: [],
        selectValue: {
            duration: 'Daily',
            language: 'Language',
            spokenLanguage: 'Spoken Language'
        },
        selectParam: {
            duration: 'daily',
            language: '',
            spokenLanguage: ''
        },
        load: false
    },
    onLoad() {
        this.searchList();
    },
    onShow() {
        this.getPickerList();
    },
    // 下拉刷新
    onPullDownRefresh() {
        wx.stopPullDownRefresh();
        this.searchList();
    },
    // 分享
    onShareAppMessage() {
        return {
            title: '快来看看今天有哪些热门的仓库和开发者吧！',
            path: '/pages/tabPages/trend/trend'
        }
    },
    switchTab(e) {
        const tabName = e.currentTarget.dataset.type;
        wx.pageScrollTo({
            scrollTop: 0,
            duration: 300
        });
        if (tabName === this.data.currentTab) return;
        this.setData({
            currentTab: tabName
        });
        this.getPickerList();
    },
    // 选择语言
    goToSelectLanguage() {
        wx.navigateTo({
            url: '/pages/subPages/language/language'
        });
    },
    // 去搜索页面
    gotoSearchPage() {
        wx.navigateTo({
            url: '/pages/subPages/search/search'
        });
    },
    // 获取picker列表，不同tab列表不同
    getPickerList() {
        const pickerList = [];
        const durationList = [
            {
                name: 'Today',
                param: 'daily'
            },
            {
                name: 'This week',
                param: 'weekly'
            },
            {
                name: 'This month',
                param: 'monthly'
            }
        ];
        const localLanguage = wx.getStorageSync(CONST.STORAGE_LANGUAGE);
        const localSpokeLanguage = wx.getStorageSync(CONST.STORAGE_SPOKEN_LANGUAGE);
        const tabName = this.data.currentTab;

        let languageList, spokenLanguageList;
        try {
            languageList = localLanguage ? JSON.parse(localLanguage) : [];
            spokenLanguageList = localSpokeLanguage ? JSON.parse(localSpokeLanguage) : [];
        } catch(err) {
            console.log(err);
            return false;
        }
        pickerList.push(durationList);
        pickerList.push([
            {name: 'Language', param: ''},
            ...languageList
        ]);
        if (tabName === 'repo') pickerList.push([
            {name: 'Spoken Language', param: ''},
            ...spokenLanguageList
        ]);
        this.setData({
            pickerList
        });
    },
    // 筛选变化
    onFilterChange(e) {
        const valueList = e.detail.value;
        const pickerList = this.data.pickerList;

        const durationIndex = valueList[0];
        const duration = pickerList[0][durationIndex].name;
        const durationParam = pickerList[0][durationIndex].param;

        const languageIndex = valueList[1];
        const language = pickerList[1][languageIndex].name;
        const languageParam = pickerList[1][languageIndex].param;

        this.setData({
            'selectValue.duration': duration,
            'selectValue.language': language,
            'selectParam.duration': durationParam,
            'selectParam.language': languageParam
        });
        
        if (this.currentTab === 'repo') {
            const spokenLanguageIndex = valueList[2];
            const spokenLanguage = pickerList[2][spokenLanguageIndex].name;
            const spokenLanguageParam = pickerList[2][spokenLanguageIndex].param;
            this.setData({
                'selectValue.spokenLanguage': spokenLanguage,
                'selectParam.spokenLanguage': spokenLanguageParam,
            });
        }
        
        this.searchList();
    },
    // 获取列表
    async searchList() {
        utils.showLoading();
        try {
            const repoList = await this.getRepositories();
            const developerList = await this.getDevelopers();
            this.setData({
                repoList: repoList || [],
                developerList: developerList || []
            });
            utils.hideLoading();
        } catch(err) {
            utils.showTip(err.toString());
            console.log(err);
        }
        this.setData({
            load: true
        });
    },
    // 获取repo trending
    getRepositories() {
        return new Promise((resolve, reject) => {
            const param = this.getParams('repo');
            wx.cloud.callFunction({
                name: 'trending',
                data: param
            }).then(data => {
                resolve(data.result);
            }).catch(err => {
                reject(err);
            });
        });
    },
    // 获取dev trending
    getDevelopers() {
        return new Promise((resolve, reject) => {
            const param = this.getParams('dev');
            wx.cloud.callFunction({
                name: 'trending',
                data: param
            }).then(data => {
                resolve(data.result);
            }).catch(err => {
                reject(err);
            });
        });
    },
    // 获取请求参数
    getParams(type) {
        let { duration, language, spokenLanguage } = this.data.selectParam;
        const param = {
            since: duration,
            type,
            language
        }
        if (type === 'repo') param.spokenLanguage = spokenLanguage;
        return param;
    },
    // 查看仓库详情
    viewRepoDetail(e) {
        const { name, author } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/subPages/repo/repo?author=${author}&name=${name}`
        });
    },
    // 查看开发者
    viewDeveloperDetail(e) {
        const { name } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/subPages/developer/developer?username=${name}`
        });
    }
});