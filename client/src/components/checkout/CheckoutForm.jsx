import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';

import './Checkout.css';

const cardStyle = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#32325d',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const CheckoutForm = ({ bookInfo }) => {
  const [succeeded, setSucceeded] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  let history = useHistory();

  const { id, title, amount } = bookInfo;

  useEffect(() => {
    if (bookInfo.amount) {
      // Create PaymentIntent as soon as the page loads
      window
        .fetch('/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item: { id: id, title: title, amount: amount },
          }),
        })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          setClientSecret(data.clientSecret);
        });
    }
    // eslint-disable-next-line
  }, [bookInfo]);

  const handleEmail = (event) => {
    if (event.target.value) {
      setEmail(event.target.value);
    }
  };

  const handleChange = async (event) => {
    // Listen for changes in the CardElement
    // and display any errors as the customer types their card details
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
      receipt_email: email,
    });

    if (payload.error) {
      setError(`Payment failed ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
      history.push(`/success/${payload.paymentIntent.id}`);
    }
  };

  return (
    <Card style={{ padding: '12px' }}>
      <Form className='text-left' id='payment-form' onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label type='email'>Email address</Form.Label>
          <Form.Control
            style={{ marginBottom: '16px' }}
            type='email'
            placeholder='your@email.com'
            required
            onChange={handleEmail}
          />
          <Form.Text className='text-muted'>
            A digital copy of your book and your receipt will be emailed to you.
          </Form.Text>
        </Form.Group>
        <CardElement
          id='card-element'
          options={cardStyle}
          onChange={handleChange}
        />
        <button disabled={processing || disabled || succeeded} id='submit'>
          <span id='button-text'>
            {processing ? (
              <div className='spinner' id='spinner'></div>
            ) : (
              'Pay now'
            )}
          </span>
        </button>
        {/* Show any error that happens when processing the payment */}
        {error && (
          <div className='card-error' role='alert'>
            {error}
          </div>
        )}
        {/* Show a success message upon completion */}
        <p className={succeeded ? 'result-message' : 'result-message hidden'}>
          Payment succeeded, see the result in your
          <a href={`https://dashboard.stripe.com/test/payments`}>
            {' '}
            Stripe dashboard.
          </a>{' '}
          Refresh the page to pay again.
        </p>
      </Form>
    </Card>
  );
};

export default CheckoutForm;
