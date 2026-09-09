function LandingPage({ onGetStarted }) {
  return (
    <div className="hero">
      <h1>SpendWise</h1>

      <p>Take control of your everyday spending.</p>

      <button onClick={onGetStarted}>
        Get Started
      </button>
    </div>
  )
}

export default LandingPage