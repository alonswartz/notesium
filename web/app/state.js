const { reactive, watch } = Vue;

const defaultState = {
  showLabelsPanel: false,
  showNotesPanel: false,
  showNoteSidebar: true,
};

const savedState = sessionStorage.getItem('notesiumState');
const initialState = savedState ? JSON.parse(savedState) : defaultState;
const notesiumState = reactive({ ...defaultState, ...initialState });

watch(notesiumState, (newState) => {
  Object.assign(newState, { ...defaultState, ...newState });
  sessionStorage.setItem('notesiumState', JSON.stringify(newState));
}, { deep: true });

export { notesiumState };
