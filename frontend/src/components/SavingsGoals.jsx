import { useEffect, useState } from 'react'
import API_URL from '../config/api.js'

function SavingsGoals() {
  const [goals, setGoals] = useState([])

  const [showGoalForm, setShowGoalForm] = useState(false)

  const [goalTitle, setGoalTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
const [savingAmounts, setSavingAmounts] = useState({})

const [editingGoalId, setEditingGoalId] = useState(null)

const [editTitle, setEditTitle] = useState('')
const [editTargetAmount, setEditTargetAmount] = useState('')
const [editTargetDate, setEditTargetDate] = useState('')


  const [loadingGoals, setLoadingGoals] = useState(true)
  const [goalError, setGoalError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

    fetch(`${API_URL}/api/savings-goals`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load savings goals')
        }

        return response.json()
      })
      .then((data) => {
        setGoals(data)
      })
      .catch((error) => {
        setGoalError(error.message)
      })
      .finally(() => {
        setLoadingGoals(false)
      })
  }, [])

  const handleCreateGoal = () => {
    if (!goalTitle || !targetAmount) {
      alert('Please enter a goal title and target amount')
      return
    }

    if (Number(targetAmount) <= 0) {
      alert('Target amount must be greater than 0')
      return
    }

    const token = localStorage.getItem('token')

    fetch(`${API_URL}/api/savings-goals`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        title: goalTitle,
        targetAmount: Number(targetAmount),
        targetDate: targetDate || null
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to create savings goal')
        }

        return response.json()
      })
      .then((createdGoal) => {
        setGoals((currentGoals) => [
          createdGoal,
          ...currentGoals
        ])

        setGoalTitle('')
        setTargetAmount('')
        setTargetDate('')
        setShowGoalForm(false)
      })
      .catch((error) => {
        setGoalError(error.message)
      })
  }


const handleAddSavings = (goalId) => {
  const amount = Number(savingAmounts[goalId])

  if (!amount || amount <= 0) {
    alert('Please enter a valid savings amount')
    return
  }

  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/savings-goals/${goalId}/add`, {
    method: 'PATCH',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify({
      amount: amount
    })
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to add savings')
      }

      return response.json()
    })
    .then((updatedGoal) => {

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === goalId
            ? updatedGoal
            : goal
        )
      )

      setSavingAmounts((current) => ({
        ...current,
        [goalId]: ''
      }))
    })
    .catch((error) => {
      setGoalError(error.message)
    })
}

const handleStartEdit = (goal) => {
  setEditingGoalId(goal.id)

  setEditTitle(goal.title)
  setEditTargetAmount(goal.target_amount)

  setEditTargetDate(
    goal.target_date
      ? goal.target_date.split('T')[0]
      : ''
  )
}

const handleCancelEdit = () => {
  setEditingGoalId(null)

  setEditTitle('')
  setEditTargetAmount('')
  setEditTargetDate('')
}

const handleUpdateGoal = (goalId) => {

  if (!editTitle || !editTargetAmount) {
    alert('Please enter a goal title and target amount')
    return
  }

  if (Number(editTargetAmount) <= 0) {
    alert('Target amount must be greater than 0')
    return
  }

  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/savings-goals/${goalId}`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify({
      title: editTitle,
      targetAmount: Number(editTargetAmount),
      targetDate: editTargetDate || null
    })
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to update savings goal')
      }

      return response.json()
    })
    .then((updatedGoal) => {

      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === goalId
            ? updatedGoal
            : goal
        )
      )

      handleCancelEdit()
    })
    .catch((error) => {
      setGoalError(error.message)
    })
}

const handleDeleteGoal = (goalId) => {

  const confirmDelete = window.confirm(
    'Are you sure you want to delete this savings goal?'
  )

  if (!confirmDelete) {
    return
  }

  const token = localStorage.getItem('token')

  fetch(`${API_URL}/api/savings-goals/${goalId}`, {
    method: 'DELETE',

    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to delete savings goal')
      }

      return response.json()
    })
    .then(() => {

      setGoals((currentGoals) =>
        currentGoals.filter(
          (goal) => goal.id !== goalId
        )
      )

    })
    .catch((error) => {
      setGoalError(error.message)
    })
}




const totalSaved = goals.reduce(
  (total, goal) =>
    total + Number(goal.saved_amount),
  0
)

const totalTarget = goals.reduce(
  (total, goal) =>
    total + Number(goal.target_amount),
  0
)

const achievedGoals = goals.filter(
  (goal) =>
    Number(goal.saved_amount) >=
    Number(goal.target_amount)
).length


  const formatCurrency = (value) => {
    return Number(value).toLocaleString('en-IN')
  }

  return (
    <div className="savings-section">

      <div className="savings-header">
        <div>
          <h2>Savings Goals</h2>
          <p>Track progress towards your financial goals.</p>
        </div>


<div className="savings-overview">

  <div className="savings-overview-card">
    <p>Total Saved</p>

    <h3>
      ₹{formatCurrency(totalSaved)}
    </h3>
  </div>

  <div className="savings-overview-card">
    <p>Total Goal Value</p>

    <h3>
      ₹{formatCurrency(totalTarget)}
    </h3>
  </div>

  <div className="savings-overview-card">
    <p>Goals Achieved</p>

    <h3>
      {achievedGoals} of {goals.length}
    </h3>
  </div>

</div>



        <button
          onClick={() =>
            setShowGoalForm(!showGoalForm)
          }
        >
          {showGoalForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showGoalForm && (
        <div className="savings-form">

          <input
            type="text"
            placeholder="Goal name"
            value={goalTitle}
            onChange={(event) =>
              setGoalTitle(event.target.value)
            }
          />

          <input
            type="number"
            placeholder="Target amount"
            value={targetAmount}
            onChange={(event) =>
              setTargetAmount(event.target.value)
            }
          />

          <input
            type="date"
            value={targetDate}
            onChange={(event) =>
              setTargetDate(event.target.value)
            }
          />

          <button onClick={handleCreateGoal}>
            Create Goal
          </button>

        </div>
      )}

      {loadingGoals && (
        <p>Loading savings goals...</p>
      )}

      {goalError && (
        <p className="error-message">
          {goalError}
        </p>
      )}

      {!loadingGoals &&
        !goalError &&
        goals.length === 0 && (
          <p>
            No savings goals yet. Create your first goal.
          </p>
        )}

      <div className="savings-grid">

        {goals.map((goal) => {
          const saved = Number(goal.saved_amount)
          const target = Number(goal.target_amount)
const isAchieved = saved >= target


          const percentage =
            target > 0
              ? Math.min((saved / target) * 100, 100)
              : 0

          return (
            <div
              className="savings-card"
              key={goal.id}
            >

              <div className="savings-card-header">

  <div>
    <h3>{goal.title}</h3>

    {isAchieved && (
      <span className="goal-achieved">
        🎉 Goal Achieved
      </span>
    )}
  </div>

  <strong>
    {saved >= target
      ? `${((saved / target) * 100).toFixed(1)}%`
      : `${percentage.toFixed(1)}%`}
  </strong>

</div>

              <p>
                ₹{formatCurrency(saved)}
                {' '}saved of{' '}
                ₹{formatCurrency(target)}
              </p>

              <div className="savings-progress">
                <div
                  className="savings-progress-fill"
                  style={{
                    width: `${percentage}%`
                  }}


                />
              </div>

{isAchieved && (
  <p className="goal-complete-message">
    Target completed — great progress!
  </p>
)}

              {goal.target_date && (
                <small>
                  Target:{' '}
                  {new Date(
                    goal.target_date
                  ).toLocaleDateString(
                    'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }
                  )}
                </small>
              )}

<div className="add-savings">

  <input
    type="number"
    placeholder="Amount to add"
    value={savingAmounts[goal.id] || ''}
    onChange={(event) =>
      setSavingAmounts((current) => ({
        ...current,
        [goal.id]: event.target.value
      }))
    }
  />

  <button
    onClick={() =>
      handleAddSavings(goal.id)
    }
  >
    + Add Savings
  </button>

</div>


{editingGoalId === goal.id && (

  <div className="edit-goal-form">

    <input
      type="text"
      value={editTitle}
      onChange={(event) =>
        setEditTitle(event.target.value)
      }
    />

    <input
      type="number"
      value={editTargetAmount}
      onChange={(event) =>
        setEditTargetAmount(event.target.value)
      }
    />

    <input
      type="date"
      value={editTargetDate}
      onChange={(event) =>
        setEditTargetDate(event.target.value)
      }
    />

    <div className="edit-goal-actions">

      <button
        onClick={() =>
          handleUpdateGoal(goal.id)
        }
      >
        Save
      </button>

      <button onClick={handleCancelEdit}>
        Cancel
      </button>

    </div>

  </div>

)}


<div className="goal-actions">

  <button
    onClick={() => handleStartEdit(goal)}
  >
    Edit Goal
  </button>

  <button
    onClick={() => handleDeleteGoal(goal.id)}
  >
    Delete Goal
  </button>

</div>

            </div>
          )
        })}

      </div>

    </div>
  )
}



export default SavingsGoals