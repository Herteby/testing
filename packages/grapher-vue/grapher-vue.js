import {Minimongo} from 'meteor/minimongo'
function get(obj, key) {
	return key.split(".").reduce(function(parent, child) {
		if(parent === undefined || parent === null){
			return parent
		} else {
			return parent[child]
		}
	}, obj)
}
export default {
	install(Vue, options){
		Vue.mixin({
			beforeCreate(){
				this._grapher = {}
			},
			created(){
				if(this.$options.grapher){
					_.each(this.$options.grapher, (fn, name) => {
						this.$data[name] = { //Initial "dummy result"
							ready:false,
							readyOnce:false,
							data:[]
						}
						Vue.util.defineReactive(this, name, null)
						let computation
						let readyOnce = false
						let nonreactive
						//Run this function once, and every time the query parameters change
						let unwatch = this.$watch(fn, params => {
							nonreactive = params.reactive === false
							let start = new Date(), time
							if(!this._grapher[name]){ //Create the query
								this._grapher[name] = params.collection.createQuery(params.query)
							}
							let query = this._grapher[name]
							query.body = params.query
							if(params.single){
								if(!query.body.$options){
									query.body.$options = {}
								}
								query.body.$options.limit = 1
							}
							if(params.subscribe === false){ //"Method style" fetch
								if(query.subscriptionHandle){ //Handle switching from subscription-based
									this.$stopHandle(computation)
									query.unsubscribe()
								}
								this[name].ready = false 
								query.fetch((err,data) => {
									if(err){
										console.err(err)
									} else {
										if(params.where){
											let matcher = new Minimongo.Matcher(params.where)
											data = _.filter(data, doc => matcher.documentMatches(doc).result)
										}
										if(params.single){
											data = data[0]
										}
										this[name] = {
											ready:true,
											readyOnce:true,
											count:params.single ? undefined : data.length,
											time:new Date() - start,
											data:data
										}
									}
								})
							} else { //Subscribe and fetch
								let oldSub = query.subscriptionHandle
								query.subscribe()
								if(oldSub){
									oldSub.stop()
								}
								if(computation){
									this.$stopHandle(computation)
								}
								computation = this.$autorun(()=>{
									let ready = query.subscriptionHandle.ready()
									if(ready && !readyOnce){
										readyOnce = true
									}
									if(ready && !time){
										time = new Date() - start
									}
									let data = query.fetch()
									if(params.where){
										let matcher = new Minimongo.Matcher(params.where)
										data = _.filter(data, doc => matcher.documentMatches(doc).result)
									}
									if(params.single){
										data = data[0]
									}
									this[name] = Object.freeze({
										ready:ready,
										readyOnce:readyOnce,
										count:params.single ? undefined : data.length,
										time:time,
										data:data
									})
								})
							}
						},{immediate:true})
						if(nonreactive){
							unwatch() //stop the watcher after the first run if the user specified reactive:false
						}
					})
				}
			},
			destroyed(){
				_.each(this._grapher, query => query.unsubscribe())
				this._grapher = null
			}
		})
	}
}
