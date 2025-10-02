import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserSession,
} from 'amazon-cognito-identity-js';

const poolData = {
    UserPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID!,
    ClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID!,
};

export const userPool = new CognitoUserPool(poolData);

export const signIn = (email: string, password: string) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
    });

    return new Promise<{
        session?: CognitoUserSession;
        accessToken?: string;
        idToken?: string;
        refreshToken?: string;
        challenge?: 'NEW_PASSWORD_REQUIRED';
        user?: CognitoUser;
    }>((resolve, reject) => {
        user.authenticateUser(authDetails, {
            onSuccess: (session) => {
                const accessToken = session.getAccessToken().getJwtToken();
                const idToken = session.getIdToken().getJwtToken();
                const refreshToken = session.getRefreshToken().getToken();

                resolve({
                    session,
                    accessToken,
                    idToken,
                    refreshToken,
                });
            },
            onFailure: (err) => {
                reject(err);
            },
            newPasswordRequired: (userAttributes, requiredAttributes) => {
                delete userAttributes.email_verified;
                delete userAttributes.phone_number_verified;

                sessionStorage.setItem('cognitoUsername', email);

                resolve({
                    challenge: 'NEW_PASSWORD_REQUIRED',
                    user,
                });
            },
        });
    });
};

export const forgotPassword = (email: string): Promise<CognitoUser> => {
    const userData = {
        Username: email,
        Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
        cognitoUser.forgotPassword({
            onSuccess: () => {
                resolve(cognitoUser);
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
};

export const confirmForgotPassword = (
    email: string,
    code: string,
    newPassword: string
): Promise<void> => {
    const userPool = new CognitoUserPool(poolData);
    const userData = {
        Username: email,
        Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess() {
                resolve();
            },
            onFailure(err) {
                reject(err);
            },
        });
    });
};

export const completeNewPasswordChallenge = (
    user: CognitoUser,
    newPassword: string
) => {
    return new Promise<CognitoUserSession>((resolve, reject) => {
        user.completeNewPasswordChallenge(
            newPassword,
            {},
            {
                onSuccess: (session) => {
                    resolve(session);
                },
                onFailure: (err) => {
                    reject(err);
                },
            }
        );
    });
};