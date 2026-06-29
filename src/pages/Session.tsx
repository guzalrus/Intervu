import { useLocation } from 'react-router-dom'

// A small hardcoded question bank for now
const questions: Record<string, string[]> = {
  random: [
    'Tell me about a time you had to work with a difficult team member.',
    'Describe a situation where you had to meet a tight deadline.',
    'Tell me about a time you failed and what you learned from it.',
    'Give an example of a goal you reached and how you achieved it.',
    'Describe a time you showed leadership.',
  ],
  leadership: [
    'Tell me about a time you led a team through a difficult situation.',
    'Describe a time you had to make a tough decision as a leader.',
    'How have you motivated others when morale was low?',
  ],
  conflict: [
    'Tell me about a time you disagreed with your manager.',
    'Describe a situation where you had to resolve a conflict between teammates.',
    'How do you handle it when someone criticizes your work?',
  ],
  teamwork: [
    'Tell me about a time you collaborated on a challenging project.',
    'Describe a situation where you had to rely on a teammate.',
    'How do you handle it when a team member isn\'t pulling their weight?',
  ],
  growth: [
    'Tell me about a time you failed and what you learned.',
    'Describe a skill you taught yourself and how you did it.',
    'Tell me about a piece of feedback that changed how you work.',
  ],
}



function Session() {
    const location = useLocation()
    const  { questionSet, cameraPreview } = location.state ?? {questionSet: 'random', cameraPreview: true}
    
    // pick the right questions, fallback to random
    const sessionQuestions = questions[questionSet] ?? questions.random
    
    console.log('Question Set:', questionSet)
    console.log('Camera preview:', cameraPreview)
    console.log('Questions:', sessionQuestions)
    return (
  <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
    <p className="text-white text-lg">Session page</p>
    <p className="text-gray-400 text-sm">Question set: {questionSet}</p>
    <p className="text-gray-400 text-sm">First question: {sessionQuestions[0]}</p>
  </div>
)

}
export default Session