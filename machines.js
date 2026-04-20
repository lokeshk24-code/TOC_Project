

const MACHINES = {

  
  equal01: {
    name: "Equal 0s and 1s",
    states: ["q0", "q1", "q2", "q3", "q4", "accept", "reject"],
    startState: "q0",
    acceptState: "accept",
    rejectState: "reject",
    defaultInput: "001011",
    transitions: [
      { from: "q0", read: "0", write: "X", move: "R", to: "q1" },
      { from: "q0", read: "1", write: "Y", move: "R", to: "q2" },
      { from: "q0", read: "X", write: "X", move: "R", to: "q0" },
      { from: "q0", read: "Y", write: "Y", move: "R", to: "q0" },
      { from: "q0", read: "B", write: "B", move: "R", to: "accept" },

      { from: "q1", read: "0", write: "0", move: "R", to: "q1" },
      { from: "q1", read: "X", write: "X", move: "R", to: "q1" },
      { from: "q1", read: "Y", write: "Y", move: "R", to: "q1" },
      { from: "q1", read: "1", write: "Y", move: "L", to: "q3" },
      { from: "q1", read: "B", write: "B", move: "R", to: "reject" },

      { from: "q2", read: "1", write: "1", move: "R", to: "q2" },
      { from: "q2", read: "X", write: "X", move: "R", to: "q2" },
      { from: "q2", read: "Y", write: "Y", move: "R", to: "q2" },
      { from: "q2", read: "0", write: "X", move: "L", to: "q4" },
      { from: "q2", read: "B", write: "B", move: "R", to: "reject" },

      { from: "q3", read: "0", write: "0", move: "L", to: "q3" },
      { from: "q3", read: "1", write: "1", move: "L", to: "q3" },
      { from: "q3", read: "X", write: "X", move: "L", to: "q3" },
      { from: "q3", read: "Y", write: "Y", move: "L", to: "q3" },
      { from: "q3", read: "B", write: "B", move: "R", to: "q0" },

      { from: "q4", read: "0", write: "0", move: "L", to: "q4" },
      { from: "q4", read: "1", write: "1", move: "L", to: "q4" },
      { from: "q4", read: "X", write: "X", move: "L", to: "q4" },
      { from: "q4", read: "Y", write: "Y", move: "L", to: "q4" },
      { from: "q4", read: "B", write: "B", move: "R", to: "q0" },
    ]
  },

 
  palindrome: {
    name: "Binary Palindrome",
    states: ["q0", "q1", "q2", "q3", "q4", "q5", "accept", "reject"],
    startState: "q0",
    acceptState: "accept",
    rejectState: "reject",
    defaultInput: "10101",
    transitions: [
      { from: "q0", read: "0", write: "X", move: "R", to: "q1" },
      { from: "q0", read: "1", write: "Y", move: "R", to: "q2" },
      { from: "q0", read: "X", write: "X", move: "R", to: "q5" },
      { from: "q0", read: "Y", write: "Y", move: "R", to: "q5" },
      { from: "q0", read: "B", write: "B", move: "R", to: "accept" },

      { from: "q1", read: "0", write: "0", move: "R", to: "q1" },
      { from: "q1", read: "1", write: "1", move: "R", to: "q1" },
      { from: "q1", read: "X", write: "X", move: "R", to: "q1" },
      { from: "q1", read: "Y", write: "Y", move: "R", to: "q1" },
      { from: "q1", read: "B", write: "B", move: "L", to: "q3" },

      { from: "q2", read: "0", write: "0", move: "R", to: "q2" },
      { from: "q2", read: "1", write: "1", move: "R", to: "q2" },
      { from: "q2", read: "X", write: "X", move: "R", to: "q2" },
      { from: "q2", read: "Y", write: "Y", move: "R", to: "q2" },
      { from: "q2", read: "B", write: "B", move: "L", to: "q4" },

      { from: "q3", read: "0", write: "X", move: "L", to: "q5" },
      { from: "q3", read: "1", write: "X", move: "R", to: "reject" },
      { from: "q3", read: "X", write: "X", move: "L", to: "q5" },
      { from: "q3", read: "Y", write: "Y", move: "R", to: "reject" },

      { from: "q4", read: "1", write: "Y", move: "L", to: "q5" },
      { from: "q4", read: "0", write: "Y", move: "R", to: "reject" },
      { from: "q4", read: "Y", write: "Y", move: "L", to: "q5" },
      { from: "q4", read: "X", write: "X", move: "R", to: "reject" },

      { from: "q5", read: "0", write: "0", move: "L", to: "q5" },
      { from: "q5", read: "1", write: "1", move: "L", to: "q5" },
      { from: "q5", read: "X", write: "X", move: "L", to: "q5" },
      { from: "q5", read: "Y", write: "Y", move: "L", to: "q5" },
      { from: "q5", read: "B", write: "B", move: "R", to: "q0" },
    ]
  },


  unary: {
    name: "Unary Addition",
    states: ["q0", "q1", "accept"],
    startState: "q0",
    acceptState: "accept",
    rejectState: "reject",
    defaultInput: "111+11",
    transitions: [
      { from: "q0", read: "1", write: "1", move: "R", to: "q0" },
      { from: "q0", read: "+", write: "1", move: "R", to: "q1" },
      { from: "q0", read: "B", write: "B", move: "R", to: "accept" },
      { from: "q1", read: "1", write: "1", move: "R", to: "q1" },
      { from: "q1", read: "B", write: "B", move: "L", to: "accept" },
    ]
  },

 
  custom: {
    name: "My Custom TM",
    states: [],
    startState: "q0",
    acceptState: "accept",
    rejectState: "reject",
    defaultInput: "",
    transitions: []
  }
};
