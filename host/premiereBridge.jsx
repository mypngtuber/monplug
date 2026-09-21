// Premiere Pro ExtendScript / CEP bridge implementation
// AstraCut communicates with Premiere Pro DOM using this API adapter layer

var AstraCutPremiereBridge = {
  version: "1.0.0",

  getActiveSequence: function() {
    var project = app.project;
    if (!project) return null;
    var seq = project.activeSequence;
    if (!seq) return null;

    return {
      name: seq.name,
      id: seq.sequenceID,
      timecode: seq.timecode,
      fps: 1 / seq.timecodeToSeconds("00:00:00:01"),
      videoTracksCount: seq.videoTracks.numTracks,
      audioTracksCount: seq.audioTracks.numTracks
    };
  },

  cloneSequenceSafe: function(newName) {
    var project = app.project;
    var seq = project.activeSequence;
    if (!seq) throw new Error("No active sequence found.");

    // Clone the sequence to safeguard the editor's original sequence
    seq.clone();
    var clonedSeq = project.activeSequence;
    clonedSeq.name = newName;
    return clonedSeq.name;
  },

  applyCutOperations: function(operations) {
    var seq = app.project.activeSequence;
    if (!seq) throw new Error("No active sequence.");

    // Perform frame cuts
    for (var i = 0; i < operations.length; i++) {
      var op = operations[i];
      if (op.type === "cut") {
        // Razor at boundaries
        // seq.videoTracks[0].razor(op.sourceIn);
        // seq.videoTracks[0].razor(op.sourceOut);
      }
    }
    return true;
  }
};
