// services/cognito-update.ts
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool } from './cognito';

/** Lê o usuário atual autenticado */
export function getCurrentCognitoUser(): CognitoUser | null {
    return userPool.getCurrentUser();
}

/** Atualiza atributos custom:* do próprio usuário */
export function updateCustomAttributes(
    user: CognitoUser,
    attrs: Record<string, string>
) {
    const list = Object.entries(attrs).map(
        ([k, v]) => new CognitoUserAttribute({ Name: `custom:${k}`, Value: v })
    );

    return new Promise<string>((resolve, reject) => {
        // garantir sessão válida
        user.getSession((err: any) => {
            if (err) return reject(err);

            user.updateAttributes(list, (e, result) => {
                if (e) return reject(e);
                resolve(result as string);
            });
        });
    });
}

/** Faz refresh para obter novo ID Token já com as mudanças do PreToken */
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