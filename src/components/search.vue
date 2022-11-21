<template>
    <b-card bg-variant="light" no-body class="flex-grow-1 d-flex rounded-sm shadow-sm">
        <b-overlay :show="!ready" class="flex-grow-1 d-flex flex-column">
            <b-card-body class="flex-grow-1">
                <b-input-group class="ignore_search mb-4">
                    <template #prepend>
                        <b-input-group-text>
                            <b-icon-search/>
                        </b-input-group-text>
                    </template>

                    <b-form-input type="search" placeholder="Search .gitignores" size="sm" v-model="search"/>
                </b-input-group>

                <div class="small">
                    <h6>Search results</h6>
                    <template v-for="(files, category) in filtered">
                        <div class="d-flex align-items-center">
                            <hr class="flex-grow-1 m-0"/>
                            <p class="pl-3 mb-0 small text-grey text-center">
                                {{ name(category) }}
                            </p>
                        </div>

                        <p v-if="!files || !files.length" class="text-grey small font-italic mb-0">No results</p>

                        <template v-else>
                            <a v-for="file in always(files, category)" class="d-block small pb-0 text-dark"
                               role="button"
                               :class="{'font-weight-bold': file.selected}" @click.prevent="toggleFile(file)">
                                {{ file.title }}<span class="font-italic small text-grey">.gitignore</span>
                            </a>
                            <template v-if="hidden(files, category).length > 0">
                                <b-collapse :visible="visible[category]">
                                    <a v-for="file in hidden(files, category)" class="d-block small pb-0 text-dark"
                                       role="button"
                                       :class="{'font-weight-bold': file.selected}" @click.prevent="toggleFile(file)">
                                        {{ file.title }}<span class="font-italic small text-grey">.gitignore</span>
                                    </a>
                                </b-collapse>

                                <a v-if="visible[category]" class="d-block text-grey text-center small mb-0"
                                   role="button"
                                   @click="visible[category] = false">
                                    Show less
                                    <b-icon-caret-up-fill/>
                                </a>
                                <template v-else>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <p class="d-block small mb-0 text-grey">
                                            ...
                                        </p>

                                        <a class="d-block text-grey text-center small mb-0" role="button"
                                           @click="visible[category] = true">
                                            Show more
                                            <b-icon-caret-down-fill/>
                                        </a>

                                        <span/>
                                    </div>
                                </template>
                            </template>

                        </template>
                    </template>
                </div>
            </b-card-body>
            <b-card-footer class="small p-1">
                <a role="button" class="d-block small text-center text-muted" @click="resetFiles()">
                    Reset
                    <b-icon-x/>
                </a>
            </b-card-footer>
        </b-overlay>
    </b-card>
</template>

<script>
export default {
    async mounted() {
        if (this.$store.state.files.length < 1)
            await this.$store.dispatch('loadFiles')
        this.ready = true
    },
    data() {
        return {
            ready: false,
            search: null,
            visible: {
                main: false,
                community: false,
                global: false,
            }
        }
    },
    computed: {
        filter() {
            return this.search ? new RegExp(this.search, 'ig') : null
        },
        filtered() {
            return Object.keys(this.$store.getters.filesByCategory)
                .reduce((categories, category) => {
                    categories[category] = this.$store.getters.filesByCategory[category]
                        .filter((file) => this.filter ? file.name.match(this.filter) : true)
                    return categories
                }, {})
        }
    },
    methods: {
        name(val) {
            return {
                main: 'Supported templates',
                community: 'Community templates',
                global: 'Auxiliary templates',
            }[val]
        },
        toggleFile(file) {
            if (file.selected)
                this.$store.commit('removeFile', {name: file.name})
            else
                this.$store.commit('selectFile', {name: file.name})
        },
        resetFiles() {
            this.$store.commit('resetFiles')
        },
        always(files, category) {
            let top = files.slice(0, 3),
                selected = this.visible[category] ? []
                    : files.filter((file) => file.selected && !top.find(({name}) => file.name === name))
            return [
                ...top,
                ...selected
            ]
        },
        hidden(files, category) {
            return files.slice(3).filter((file) => !file.selected || this.visible[category])
        }
    }
}
</script>