import Vue from 'vue'
import Vuex from 'vuex'

import {Octokit} from 'octokit'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        octokit: new Octokit(),
        files: [],
        selections: [],
        results: {},
        features: []
    },
    getters: {
        filesByCategory(state) {
            return state.files.reduce((groups, file) => {
                if (!(file.category in groups))
                    groups[file.category] = []
                groups[file.category].push({
                    ...file,
                    selected: state.selections.includes(file.name)
                })
                return groups
            }, {})
        },
        selectedFiles(state) {
            return state.files.filter((file) => state.selections.includes(file.name))
        },
        file(state) {
            return ({file: {name}}) => {
                let theFile = state.results[name]
                if (!theFile)
                    return null


                return theFile.split('\n\n').reduce((file, groups) => {
                    let lines = groups.split('\n'),
                        hasComment = lines[0].substr(0, 2) === '# '

                    if (!hasComment)
                        file.main = file.main.length > 0
                            ? file.main.concat(lines.filter(Boolean))
                            : lines.filter(Boolean)
                    else
                        file.optional.push(lines)

                    return file
                }, {
                    main: [],
                    optional: []
                })
            }
        },
        fileFeatures(state, getters) {
            return ({file}) => {
                let theFile = getters.file({file})

                if (!theFile)
                    return theFile

                return theFile.optional.map((feature) => {
                    return feature.reduce((feature, line) => {
                        if (!line) {
                            if (feature.lines.length > 0)
                                feature.lines.push(null)

                            return feature
                        }

                        let isComment = line.substr(0, 2) === '# ',
                            _line = line

                        if (isComment && feature.lines.length < 1)
                            feature.text = (feature.text ? `${feature.text} ` : '')
                                .concat(line.replace(/^# ?(.*?)/, '$1'))
                        else
                            _line = _line.replace(/^# ?(.*?)/, '$1')

                        feature.lines.push(_line)

                        if (line.substr(0, 1) !== '#')
                            feature.default = true

                        return feature
                    }, {text: null, lines: [], default: false})
                })
            }
        },
        selectedFeatures(state) {
            return ({file: {name}}) => {
                return state.features.reduce((features, selection) => {
                    if (selection.name === name)
                        features[selection.index] = selection.state

                    return features
                }, {})
            }
        }
    },
    mutations: {
        addFile(state, {file}) {
            /* File:
            mode: "100644"
            path: "AL.gitignore"
            sha: "02eac6989ad65d3fcea222171a83a1348ee0dbd9"
            size: 371
            type: "blob"
            url: "https://api.github.com/repos/github/gitignore/git/blobs/02eac6989ad65d3fcea222171a83a1348ee0dbd9"
             */
            state.files.push({
                name: file.path,
                title: file.path.replace(/^.*?([^\/]+)\.gitignore$/, '$1'),
                path: file.path.replace(/^[^\/]*\/((?:[^\/]*\/?)+)\/[^.]+?\..+$|.*/, '$1')
                    .split('/').reduce((acc, el) => acc.length < 1 && !el ? null : acc.concat(el), []),
                category: (file.path.replace(/^(?:(Global|community)|.*).*/i, '$1') || 'main').toLowerCase(),
                token: file.sha
            })
        },
        resetFiles(state) {
            Vue.set(state, 'selections', [])
        },
        selectFile(state, {name} = {}) {
            state.selections.push(name)
        },
        removeFile(state, {name} = {}) {
            state.selections.splice(state.selections.indexOf(name), 1)
        },

        addResult(state, {name, result = null} = {}) {
            if (result) {
                console.log(`[*] .gitignore ${name} loaded`)
                console.groupCollapsed(`[*] .gitignore ${name} content`)
                console.log(result)
                console.groupEnd()
            } else {
                console.log(`[*] requested .gitignore ${name}`)
            }

            Vue.set(state.results, name, result)
        },

        resetFeatures(state) {
            Vue.set(state, 'features', [])
        },
        selectFeature(_state, {file: {name}, index, state} = {}) {
            _state.features.push({name, index, state})
        },
        removeFeature(state, {file: {name}, index = null} = {}) {
            if (index === null)
                Vue.set(state, 'features', state.features.filter((feature) => feature.name !== name))
            else {
                state.features.splice(
                    state.features.findIndex((feature) => feature.name === name && feature.index === index),
                    1
                )
            }
        },
    },
    actions: {
        async loadFiles({state, commit}) {
            let {data: {tree}} = await state.octokit.request('GET /repos/{owner}/{repo}/git/trees/main?recursive=1', {
                owner: 'github',
                repo: 'gitignore'
            })

            for (let file of tree) {
                if (file.mode.substr(0, 1) === '1' && file.path.match(/\.gitignore$/))
                    commit('addFile', {file})
            }
        },
        async loadFile({state, commit, getters}, {file, force = false} = {}) {
            if (force || !(file.name in state.results)) {
                commit('addResult', {name: file.name})
                let {data: {content}} = await state.octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
                    owner: 'github',
                    repo: 'gitignore',
                    file_sha: file.token
                })
                commit('addResult', {name: file.name, result: atob(content)})

                getters.fileFeatures({file}).forEach(({default: d}, index) => {
                    commit('selectFeature', {file, index, state: d})
                }, [])
            }
        }
    },
    modules: {}
})
