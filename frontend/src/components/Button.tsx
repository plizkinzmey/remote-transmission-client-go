import styled from '@emotion/styled';

interface ButtonProps {
  variant?: 'icon' | 'default' | 'danger';
  loading?: boolean;
}

export const Button = styled.button<ButtonProps>`
  background-color: ${props => {
    if (props.variant === 'icon') return 'transparent';
    if (props.variant === 'danger') return '#e74c3c';
    return '#2c3e50';
  }};
  color: ${props => props.variant === 'icon' ? '#2c3e50' : 'white'};
  border: none;
  border-radius: ${props => props.variant === 'icon' ? '50%' : '4px'};
  padding: ${props => props.variant === 'icon' ? '8px' : '8px 16px'};
  font-size: 14px;
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 400;
  cursor: ${props => props.loading ? 'wait' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: ${props => props.loading || props.disabled ? 0.5 : 1};
  width: ${props => props.variant === 'icon' ? '32px' : 'auto'};
  height: ${props => props.variant === 'icon' ? '32px' : 'auto'};
  &:hover {
    background-color: ${props => {
      if (props.variant === 'icon') return '#f0f2f4';
      if (props.variant === 'danger') return '#c0392b';
      return '#34495e';
    }};
  }
  &:disabled {
    background-color: ${props => props.variant === 'icon' ? '#f0f2f4' : '#95a5a6'};
    cursor: not-allowed;
  }
  svg {
    width: ${props => props.variant === 'icon' ? '16px' : '14px'};
    height: ${props => props.variant === 'icon' ? '16px' : '14px'};
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
`;