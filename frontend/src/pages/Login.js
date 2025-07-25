import React from 'react';
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBIcon
} from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/auth/google/login";
  };

  return (
    <MDBContainer fluid className="vh-100 d-flex justify-content-center align-items-center" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Blurred background div */}
      <div
        style={{
          backgroundImage: `url("https://imgs.search.brave.com/DfA7xYOPN1nTpIaPBi4CKAb58fGGPGO4Fr77l6R7LCE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzc4LzI5/LzViLzc4Mjk1YjRi/YzVhZmIwNjQ5Njg5/N2M2ZWIyNTVjYzRk/LmpwZw")`,
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      />

      {/* Content card with higher z-index */}
      <MDBCard className="p-4 shadow" style={{ maxWidth: '400px', width: '100%', position: 'relative', zIndex: 1 }}>
        <MDBCardBody className="text-center">

          <div className="mb-3">
            <MDBIcon fas icon="cubes fa-2x me-2" style={{ color: '#ff6219' }} />
            <span className="h3 fw-bold">Chat Application</span>
          </div>

          <div className="my-4">
            <MDBIcon fab icon="google" size="4x" style={{ color: '#ea4335' }} />
          </div>

          <h5 className="fw-normal mb-4" style={{ letterSpacing: '1px' }}>
            Sign in with your Google Account
          </h5>

          <MDBBtn color="danger" size="lg" onClick={handleGoogleLogin}>
            <MDBIcon fab icon="google" className="me-2" />
            Login with Google
          </MDBBtn>

          <div className="d-flex justify-content-center mt-4">
            <a href="#!" className="small text-muted me-2">Terms of use</a>
            <a href="#!" className="small text-muted">Privacy policy</a>
          </div>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}

export default Login;
