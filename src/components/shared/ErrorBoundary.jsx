import React from 'react';
import PropTypes from 'prop-types';
import { PRIVACY_COPY } from '../../config/constants.js';

const INITIAL_STATE = {
  hasError: false,
  error: null,
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = INITIAL_STATE;
    this.headingRef = React.createRef();
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch {
        // Error reporting must not replace the recovery interface.
      }
    }
  }

  componentDidUpdate(_, previousState) {
    if (!previousState.hasError && this.state.hasError) {
      this.headingRef.current?.focus();
    }
  }

  handleReset = () => {
    try {
      if (typeof this.props.onReset === 'function') {
        this.props.onReset();
      }

      this.setState(INITIAL_STATE);
    } catch {
      this.setState({
        hasError: true,
      });
    }
  };

  renderFallback() {
    const { resetLabel } = this.props;

    return (
      <main
        aria-labelledby="error-boundary-title"
        className="flex min-h-screen items-center justify-center bg-nova-cream px-4 py-12"
      >
        <section
          role="alert"
          className="w-full max-w-2xl rounded-card border border-nova-slate/20 bg-white p-6 shadow-card sm:p-8"
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-nova-coral/20 text-2xl text-nova-midnight" aria-hidden="true">
            !
          </div>

          <h1
            id="error-boundary-title"
            ref={this.headingRef}
            tabIndex="-1"
            className="text-2xl font-bold text-nova-midnight outline-none sm:text-3xl"
          >
            Something went wrong
          </h1>

          <p className="mt-3 text-base text-nova-ink">
            Nova Bank Demo could not display this part of the experience. You
            can try again or reset the current view.
          </p>

          <div className="mt-6 space-y-3 rounded-lg bg-nova-sky/50 p-4 text-sm text-nova-ink">
            <p>{PRIVACY_COPY.demoNotice}</p>
            <p>{PRIVACY_COPY.dataNotice}</p>
            <p>{PRIVACY_COPY.securityNotice}</p>
          </div>

          <button
            type="button"
            onClick={this.handleReset}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            {resetLabel}
          </button>
        </section>
      </main>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  resetLabel: PropTypes.string,
};

ErrorBoundary.defaultProps = {
  onError: undefined,
  onReset: undefined,
  resetLabel: 'Try again',
};

export default ErrorBoundary;