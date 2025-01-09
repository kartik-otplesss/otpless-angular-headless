import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {


  inputMobile: string;
  otpInput: string;
  OTPlessSignin: any = null;
  isValid: boolean = false;
  isValidOtp: boolean = false;

  showError(message: string) {
    const errorSection = document.getElementById("error");
    if (errorSection) {
      errorSection.textContent = message;
      errorSection.classList.remove("hidden");
    }
  }

  onInput() {
    console.log(this, 'onInput')
    this.isValid = /^[0-9]{10}$/.test(this.inputMobile);
  }

  async OTPlessSdk() {
    return new Promise<void>((resolve) => {
      if (document.getElementById("otpless-sdk") && this.OTPlessSignin) {
        return resolve();
      }

      const script = document.createElement("script");
      script.src = "https://otpless.com/v4/headless.js";
      script.id = "otpless-sdk";
      script.setAttribute("data-appid", "Your_app_id");

      script.onload = () => {
        const OTPless = Reflect.get(window, "OTPless");
        this.OTPlessSignin = new OTPless(this.callback);
        resolve();
      };

      document.head.appendChild(script);
    });
  }

  async hitOTPlessSdk(params: { requestType: string; request: any }) {
    await this.OTPlessSdk();
    const { requestType, request } = params;
    return await this.OTPlessSignin[requestType](request);
  }

  callback = (eventCallback: any) => {
    console.log({ eventCallback });

    const ONETAP = () => {
      const { response } = eventCallback;
      console.log({ response, token: response.token });
      alert(JSON.stringify(response));
      location.reload();
    };

    const OTP_AUTO_READ = () => {
      const { response: { otp } } = eventCallback;
      const otpInput = document.getElementById("input-otp") as HTMLInputElement;
      if (otpInput) {
        otpInput.value = otp;
      }
    };

    const FAILED = () => {
      const { response } = eventCallback;
      console.log({ response });
    };

    const FALLBACK_TRIGGERED = () => {
      const { response } = eventCallback;
      console.log({ response });
    };

    const EVENTS_MAP: { [key: string]: () => void } = {
      ONETAP,
      OTP_AUTO_READ,
      FAILED,
      FALLBACK_TRIGGERED,
    };

    if ("responseType" in eventCallback) {
      EVENTS_MAP[eventCallback.responseType]();
    }
  };

  async initiate() {
    const phoneNumber = this.inputMobile;
    const request = {
      channel: "PHONE",
      phone: phoneNumber,
      countryCode: "+91",
      expiry: "60",
    };
    const initiate = await this.hitOTPlessSdk({
      requestType: "initiate",
      request,
    });
    console.log({ initiate });
  }

  async oauth(channelType: string) {
    const initiate = await this.hitOTPlessSdk({
      requestType: "initiate",
      request: {
        channel: "OAUTH",
        channelType,
      },
    });
    console.log({ initiate });
  }

  async verify() {
    const phone = this.inputMobile;
    const otp = this.otpInput;
    const verify = await this.hitOTPlessSdk({
      requestType: "verify",
      request: {
        channel: "PHONE",
        phone: phone,
        otp: otp,
        countryCode: "+91",
      },
    });
    console.log({ verify });
  }

  continue() {
    const otpSection = document.getElementById("otp-section");
    const verifyOtp = document.getElementById("verify-otp");
    if (otpSection && verifyOtp) {
      otpSection.style.display = "flex";
      verifyOtp.style.display = "flex";
      this.isValidOtp = true;
      this.initiate();
    }
  }

  onOtpInput() {
    console.log(this.otpInput);
    this.isValidOtp = /^[0-9]{6}$/.test(this.otpInput);
  }
}
