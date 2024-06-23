const { reactive, watch } = Vue;

const savedState = sessionStorage.getItem('notesiumState');
const initialState = savedState ? JSON.parse(savedState) : {};
export const notesiumState = reactive(initialState);

watch(notesiumState, (updatedState) => {
  sessionStorage.setItem('notesiumState', JSON.stringify(updatedState));
}, { deep: true });

