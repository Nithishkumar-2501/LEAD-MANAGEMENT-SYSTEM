package com.vsb.leadmanagement;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request runtime microphone permission for Voice Access Model
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 101);
            }
        }

        if (bridge != null && bridge.getWebView() != null) {
            // Enable WebView audio/speech and WebRTC permissions
            bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        request.grant(request.getResources());
                    });
                }
            });

            bridge.getWebView().setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    if (uri != null) {
                        String scheme = uri.getScheme();
                        if (scheme != null) {
                            // Intercept SMS schemes (sms: and smsto:)
                            if (scheme.equalsIgnoreCase("sms") || scheme.equalsIgnoreCase("smsto")) {
                                try {
                                    Intent smsIntent = new Intent(Intent.ACTION_SENDTO, uri);
                                    smsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(smsIntent);
                                    return true;
                                } catch (Exception e) {
                                    try {
                                        Intent fallbackSms = new Intent(Intent.ACTION_VIEW, uri);
                                        fallbackSms.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        startActivity(fallbackSms);
                                        return true;
                                    } catch (Exception ex) {
                                        Toast.makeText(MainActivity.this, "No SMS messaging application found on this device", Toast.LENGTH_SHORT).show();
                                        return true;
                                    }
                                }
                            }

                            // Intercept WhatsApp schemes (whatsapp://)
                            if (scheme.equalsIgnoreCase("whatsapp")) {
                                try {
                                    Intent waIntent = new Intent(Intent.ACTION_VIEW, uri);
                                    waIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(waIntent);
                                    return true;
                                } catch (Exception e) {
                                    try {
                                        String phone = uri.getQueryParameter("phone");
                                        String text = uri.getQueryParameter("text");
                                        String fallbackUrl = "https://api.whatsapp.com/send?phone=" + (phone != null ? phone : "") + (text != null ? "&text=" + Uri.encode(text) : "");
                                        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl));
                                        webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        startActivity(webIntent);
                                        return true;
                                    } catch (Exception ex) {
                                        Toast.makeText(MainActivity.this, "WhatsApp is not installed on this device", Toast.LENGTH_SHORT).show();
                                        return true;
                                    }
                                }
                            }

                            // Intercept WhatsApp web links (api.whatsapp.com and wa.me) to open in native WhatsApp
                            if ((scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https")) &&
                                uri.getHost() != null &&
                                (uri.getHost().contains("whatsapp.com") || uri.getHost().contains("wa.me"))) {
                                try {
                                    Intent waIntent = new Intent(Intent.ACTION_VIEW, uri);
                                    waIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(waIntent);
                                    return true;
                                } catch (Exception ignored) {
                                }
                            }

                            // Intercept Phone Call scheme (tel:)
                            if (scheme.equalsIgnoreCase("tel")) {
                                try {
                                    Intent telIntent = new Intent(Intent.ACTION_DIAL, uri);
                                    telIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(telIntent);
                                    return true;
                                } catch (Exception ignored) {
                                }
                            }
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });
        }
    }
}
