const { reactive, watch } = Vue;

const defaultState = {
  showLabelsPanel: false,
  showNotesPanel: false,
  showNoteSidebar: true,
  editorLineWrapping: false,
  editorConcealFormatting: true,
  startOfWeek: 1, // 0 for Sunday, 1 for Monday, ...
};

const savedState = localStorage.getItem('notesiumState');
const initialState = savedState ? JSON.parse(savedState) : defaultState;
const notesiumState = reactive({ ...defaultState, ...initialState });

watch(notesiumState, (newState) => {
  Object.assign(newState, { ...defaultState, ...newState });
  localStorage.setItem('notesiumState', JSON.stringify(newState));
}, { deep: true });

export { notesiumState };
