import './ProgressBar.css';

interface ProgressBarProps {
  currentWeek: number;
  totalWeeks: number;
  currentDate?: Date;
}

export default function ProgressBar({ currentWeek, totalWeeks, currentDate }: ProgressBarProps) {
  const percentage = (currentWeek / totalWeeks) * 100;
  
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="progress-bar-container">
      <h3>Campaign Progress</h3>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="progress-text">
        <div>Week {currentWeek} of {totalWeeks}</div>
        {currentDate && (
          <div className="progress-date">
            {formatDate(currentDate)}
          </div>
        )}
      </div>
    </div>
  );
}

