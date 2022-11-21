<template>
    <b-card bg-variant="light" no-body class="flex-grow-1 d-flex flex-column rounded-sm shadow-sm">
        <b-card-body class="flex-grow-1">
            <h6>Compiled .gitignore</h6>
            <b-textarea size="sm" :value="text" @input="recordChanges" :rows="Math.max(5, lines.length)"/>
        </b-card-body>
        <b-card-footer class="small p-1">
            <a role="button" class="d-block small text-center text-muted" @click="resetChanges()">
                Reset
                <b-icon-x/>
            </a>
        </b-card-footer>
    </b-card>
</template>

<script>
export default {
    data() {
        return {
            changesFrom: [],
            changesTo: []
        }
    },
    computed: {
        files() {
            return this.$store.getters.selectedFiles
        },
        lines() {
            return this.files.reduce((lines, file) => {
                let content = this.$store.getters.file({file}),
                    selections = this.$store.getters.selectedFeatures({file})
                if (content) {
                    return content.optional.reduce((lines, content, index) => {
                        if (selections[index])
                            return lines.concat(content, '')

                        return lines
                    }, lines.concat(
                        (lines.length < 1 ? [] : [''])
                            .concat(`#~ ${file.category}${file.path ? '/' : ''}${(file.path || []).join('/')}/${file.title} ~#`),
                        content.main.length > 0 ? ['', '# Main'].concat(content.main, '') : ['']
                    ))
                }
                return lines
            }, [])
        },
        text() {
            return this.lines.map((line) => {
                let i = this.changesFrom.indexOf(line)
                return i >= 0 ? this.changesTo[i] : line
            }).join('\n')
        }
    },
    methods: {
        recordChanges(text) {
            let lines = text.split('\n'),
                from = [],
                to = []

            for (let line in lines) {
                let genLine = this.lines[line],
                    usrLine = lines[line]
                if (genLine && usrLine && genLine !== usrLine) {
                    from.push(genLine)
                    to.push(usrLine)
                }
            }

            if (from.length > 0) {
                this.$set(this, 'changesFrom', from)
                this.$set(this, 'changesTo', to)
            }

        },
        resetChanges() {
            this.$set(this, 'changesFrom', [])
            this.$set(this, 'changesTo', [])
        }
    }
}
</script>