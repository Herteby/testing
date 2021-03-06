import 'vue-clicky'
import Vue from 'vue'

import VueMeteorTracker from 'vue-meteor-tracker'
Vue.use(VueMeteorTracker)
Vue.config.meteor.freeze = true

import GrapherVue from 'meteor/herteby:grapher-vue'
Vue.use(GrapherVue)

import lodash from 'lodash'
_ = lodash

//Set up convenient globals

get = function(obj, key) {
	if(arguments.length == 1){
		key = obj
		obj = this
	}
	return String(key).split(".").reduce(function(parent, child) {
		if(parent === undefined || parent === null){
			return ''
		} else if (typeof parent === "function"){
			return parent()[child]
		} else if (typeof parent[child] === "function"){
			return parent[child]()
		} else {
			return parent[child]
		}
	}, obj)
}

set = Vue.set

_.extend(Vue.prototype, {
	$global:global,
	$get:get,
	_,
	Meteor
})


new Vue({
	el: '#app',
	render: h => h('layout')
})

//Testing if Vue components can be used in <head>. Turns out they can :D
new Vue({
	el:'title',
	render(h){
		return h('title','Meteor + Grapher + Vue')
	}
})