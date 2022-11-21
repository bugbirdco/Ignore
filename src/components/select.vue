<template>
    <b-card bg-variant="light" no-body class="flex-grow-1 d-flex flex-column rounded-sm shadow-sm">
        <b-card-body class="flex-grow-1">
            <h6>Select features</h6>
            <template v-for="file in files">
                <div class="mt-3">
                    <p class="mb-0 small text-grey">
                        {{ name(file) }}
                    </p>
                    <p v-if="!features(file)" class="d-block small mb-0 text-grey">
                        Loading...
                        <b-spinner small/>
                    </p>
                    <p v-else>
                        <b-checkbox-group :checked="selections(file)" @input="setFeatures(file, $event)" switches
                                          stacked size="sm">
                            <b-checkbox v-for="(feature, i) in features(file)" :value="i">
                                <span class="small">{{ feature.text }}</span>
                            </b-checkbox>
                        </b-checkbox-group>
                    </p>
                </div>
            </template>
            <p v-if="files.length < 1" class="d-block small mb-0 mt-3 text-grey font-italic">
                Select an ignore to get started!
            </p>
        </b-card-body>
        <b-card-footer class="small p-1">
            <a role="button" class="d-block small text-center text-muted" @click="resetFeatures()">
                Reset
                <b-icon-x/>
            </a>
        </b-card-footer>
    </b-card>
</template>

<script>
export default {
    computed: {
        files() {
            return this.$store.getters.selectedFiles
        },
        features() {
            return (file) => {
                let features = this.$store.getters.fileFeatures({file})
                if (!features) {
                    this.$store.dispatch('loadFile', {file})
                    return null
                } else {
                    return features
                }
            }
        },
        selections() {
            return (file) => {
                let features = this.$store.getters.selectedFeatures({file})
                return Object.keys(features).reduce((acc, index) => {
                    if (features[index])
                        acc.push(parseInt(index))
                    return acc
                }, [])
            }
        }

    },
    methods: {
        name(file) {
            return file.path ? `${file.path.join('/')}/${file.title}` : file.title
        },
        resetFeatures() {
            this.$store.commit('resetFeatures')
        },
        setFeatures(file, selections) {
            let selectedFeatures = this.$store.getters.selectedFeatures({file}),
                netSelections = Object.keys(selectedFeatures).map((index) => {
                    let _index = parseInt(index)
                    return {index: _index, state: selections.includes(_index)}
                }, [])

            this.$store.commit('removeFeature', {file})

            for (let {index, state} of netSelections) {
                this.$store.commit('selectFeature', {file, index, state})
            }
        }
    }
}
</script>