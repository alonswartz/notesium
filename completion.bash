__notesium_cmds() {
    notesium help 2>&1 | awk '/^  [a-z\-]/ {print $1}'
}

__notesium_opts() {
    notesium help 2>&1 | \
        awk '/^  [a-z]/ {cmd=$1}; /^    --/ {print cmd, $1}' | \
        awk -v cmd="^$1\ " '$0 ~ cmd {print $2}' | \
        sed 's/--sort=WORD/--sort=ctime\n--sort=mtime\n--sort=alpha/' | \
        sed 's/--prefix=WORD/--prefix=ctime\n--prefix=mtime\n--prefix=label/'
}

__notesium_complete() {
    local words
    case "${#COMP_WORDS[@]}" in
        2) words="$(__notesium_cmds)";;
        *) words="$(__notesium_opts ${COMP_WORDS[1]})";;
    esac

    # handle options with equals. COMP_WORDBREAKS is global.
    _get_comp_words_by_ref -n = cur prev
    case ${cur} in
        --prefix=*|--sort=*)
            prev="${cur%%=*}="
            cur="${cur#*=}"
            words="$(echo "$words" | awk -F "=" -v p="^$prev" '$0 ~ p {print $2}')"
            COMPREPLY=($(compgen -W "$words" -- "${cur}"))
            return 0
            ;;
    esac

    COMPREPLY=($(compgen -W "$words" -- "${COMP_WORDS[COMP_CWORD]}"))
}

complete -o default -F __notesium_complete notesium
