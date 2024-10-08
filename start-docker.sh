#!/bin/bash
set -e

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

setup_user() {
    UID="${UID:-1000}"
    GID="${GID:-1000}"
    UNAME="${USERNAME:-notesium}"

    # Rename group and create if necessary
    group=$(getent group "${GID}" | cut -d: -f1)
    if [ -n "${group}" ] && [ "${group}" != "${UNAME}" ]; then
        groupmod -n "${UNAME}" "${group}"
    else
        groupadd -g "${GID}" "${UNAME}"
    fi
    
    # Rename user and create if necessary
    user=$(getent passwd "${UID}" | cut -d: -f1)
    if [ -n "${user}" ]; then
        if [ "${user}" != "${UNAME}" ]; then
            usermod -l "${UNAME}" "${user}"
            usermod -d "/home/${UNAME}" "${UNAME}"
            
            if [ -d "/home/${user}" ]; then
                mv "/home/${user}" "/home/${UNAME}" || { echo "Failed to rename home directory"; exit 1; }
            else
                echo "Home directory for ${user} does not exist"
            fi
        fi
    else
        useradd -u "${UID}" -g "${GID}" -m "${UNAME}"
    fi

    # Set ownership of the home directory
    echo -e "${GREEN}Setting ownership of home directory for ${UNAME}...${NC}"
    mkdir -p "/home/${UNAME}/notes"
    chown -R "${UID}:${GID}" "/home/${UNAME}"
    echo -e "${GREEN}Ownership set successfully for ${UNAME}!${NC}"
}

setup_notesium_dir() {
    if [ -n "${NOTESIUM_DIR}" ]; then
        echo -e "${YELLOW}NOTESIUM_DIR is set to ${NOTESIUM_DIR}${NC}"

        # Create directory if it does not exist
        if [ ! -d "${NOTESIUM_DIR}" ]; then
            echo -e "${YELLOW}Directory ${NOTESIUM_DIR} does not exist. Creating...${NC}"
            mkdir -p "${NOTESIUM_DIR}"
            echo -e "${GREEN}Directory ${NOTESIUM_DIR} created successfully.${NC}"
        fi

        # Set permissions if needed
        if [ "$(stat -c '%u:%g' "${NOTESIUM_DIR}")" != "${UID}:${GID}" ]; then
            echo -e "${YELLOW}Setting ownership of ${NOTESIUM_DIR} to ${UNAME}...${NC}"
            chown -R "${UID}:${GID}" "${NOTESIUM_DIR}"
            echo -e "${GREEN}Ownership set successfully for ${NOTESIUM_DIR}!${NC}"
        else
            echo -e "${GREEN}Ownership for ${NOTESIUM_DIR} is already set correctly.${NC}"
        fi
    else
        echo -e "${YELLOW}NOTESIUM_DIR is not set. Skipping additional directory setup.${NC}"
    fi
}

if [ "$(id -u)" -eq 0 ]; then
    setup_user  # Call the setup_user function
    setup_notesium_dir  # Call the setup_notesium_dir function
    exec gosu "${UNAME}" "$@"  # Switch to the specified user
else
    exec "$@"  # If not root, execute the command directly
fi
