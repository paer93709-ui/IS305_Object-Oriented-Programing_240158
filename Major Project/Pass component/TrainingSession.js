class TrainingSession {
  constructor(sessionCode, topic, trainerName) {
    this.sessionCode = sessionCode;
    this.topic = topic;
    this.trainerName = trainerName;
  }

  changeTrainer(newTrainerName) {
    this.trainerName = newTrainerName
  }

  getSummary() {
    return "Session:" + this.sessionCode +
    " | Topic:" + this.topic +
    " | Trainer:" + this.trainerName
  }
}

let session1 = new TrainingSession(
    "TS01" ,
    "JavaScript Basics" ,
    "John Wama"
);


// TODO: Create session2:
// TS02, Git and GitHub, Peter Mako

let session2 = new TrainingSession(
    "TS02" ,
    "Git and GitHub" ,
    "Peter Mako"
);


// TODO: Change session2 trainer to Maria Kila
session2.changeTrainer("Maria. Kila");

// TODO: Display both summaries.
console.log(session1.getSummary());
console.log(session2.getSummary());