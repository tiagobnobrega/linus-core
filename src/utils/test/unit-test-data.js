export const stepSource = (feedback = `()=>{true}`) => ({
  feedback,
});

export const interactionSource = ({ condition = `()=>{true}`,actions }) => ({
  condition,
});
