import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    user: null,
    token: null,
    isLoggedIn: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    SET_TOKEN(state, token) {
      state.token = token
    },
    SET_LOGIN_STATUS(state, status) {
      state.isLoggedIn = status
    }
  },
  actions: {
    login({ commit }, { user, token }) {
      commit('SET_USER', user)
      commit('SET_TOKEN', token)
      commit('SET_LOGIN_STATUS', true)
    },
    logout({ commit }) {
      commit('SET_USER', null)
      commit('SET_TOKEN', null)
      commit('SET_LOGIN_STATUS', false)
    }
  }
})

export default store