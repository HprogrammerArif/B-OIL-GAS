// src/features/child/childSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Placeholder — replace with your real child model once the API contract is defined.
export interface Child {
  id: string;
  name: string;
}

interface ChildState {
  children: Child[];
}

const initialState: ChildState = {
  children: [],
};

const childSlice = createSlice({
  name: "child",
  initialState,
  reducers: {
    setChildren: (state, action: PayloadAction<Child[]>) => {
      state.children = action.payload;
    },
    addChild: (state, action: PayloadAction<Child>) => {
      state.children.push(action.payload);
    },
  },
});

export const { setChildren, addChild } = childSlice.actions;
export default childSlice.reducer;
