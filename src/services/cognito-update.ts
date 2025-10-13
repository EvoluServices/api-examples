import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool } from './cognito';


export function getCurrentCognitoUser(): CognitoUser | null {
    return userPool.getCurrentUser();
}


export function updateCustomAttributes(
    user: CognitoUser,
    attrs: Record<string, string>
) {
    const list = Object.entries(attrs).map(
        ([k, v]) => new CognitoUserAttribute({ Name: `custom:${k}`, Value: v })
    );

    return new Promise<string>((resolve, reject) => {

        user.getSession((err: any) => {
            if (err) return reject(err);

            user.updateAttributes(list, (e, result) => {
                if (e) return reject(e);
                resolve(result as string);
            });
        });
    });
}


export function refreshTokens(user: CognitoUser): Promise<{
    idToken: string;
    accessToken: string;
    refreshToken: string;
}> {
    return new Promise((resolve, reject) => {
        user.getSession((err: any, session: { getRefreshToken: () => any; }) => {
            if (err || !session) return reject(err || new Error('No session'));

            const refreshToken = session.getRefreshToken();
            user.refreshSession(refreshToken, (e, newSession) => {
                if (e) return reject(e);
                resolve({
                    idToken: newSession.getIdToken().getJwtToken(),
                    accessToken: newSession.getAccessToken().getJwtToken(),
                    refreshToken: newSession.getRefreshToken().getToken(),
                });
            });
        });
    });
}