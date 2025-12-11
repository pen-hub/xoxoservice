import { env } from '@/env';
import { ROLES } from '@/types/enum';
import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password, role } = await request.json();

    if (!admin) {
      return NextResponse.json(
        { error: 'Failed to initialize Firebase Admin' },
        { status: 500 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify user exists before updating
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(id);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const validRoles = Object.values(ROLES);
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role.' },
        { status: 400 }
      );
    }

    // Set custom claims if role is provided
    if (role) {
      try {
        await admin.auth().setCustomUserClaims(id, {
          role: role,
        });
        console.log(`Successfully set custom claims for user ${id} with role ${role}`);
      } catch (error: any) {
        console.error('Error setting custom user claims:', error);
        return NextResponse.json(
          { error: 'Failed to set custom user claims', details: error.message, code: error.code },
          { status: 500 }
        );
      }
    }

    // Update password using Firebase Admin SDK
    try {
      await admin.auth().updateUser(id, {
        password: password,
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: 'Failed to update password', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      ...(role && { roleUpdated: true })
    });

  } catch (error: any) {
    console.error('Error updating password:', error);

    return NextResponse.json(
      { error: 'Failed to update password', details: error.message, code: error.code },
      { status: 500 }
    );
  }
}
