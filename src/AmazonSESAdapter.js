require("babel-polyfill");
import { MailAdapter } from 'parse-server/lib/Adapters/Email/MailAdapter';
import AmazonSES from 'amazon-ses-mailer';
import template from 'lodash.template';
import co from 'co';
import fs from 'fs';
import path from 'path';

/**
 * MailAdapter implementation used by the Parse Server to send
 * password reset and email verification emails though AmazonSES
 * @class
 */
class AmazonSESAdapter extends MailAdapter {
  constructor(options = {}) {
    super(options);

    const {
      accessKeyId,
      secretAccessKey,
      region,
      fromAddress
    } = options;
    if (!accessKeyId || !secretAccessKey || !region || !fromAddress) {
      throw new Error('AmazonSESAdapter requires valid fromAddress, accessKeyId, secretAccessKey, region.');
    }

    const {
      templates = {}
    } = options;
    ['passwordResetEmail', 'verificationEmail'].forEach((key) => {
      const {
        subject,
        pathPlainText,
        callback
      } = templates[key] || {};
      if (typeof subject !== 'string' || typeof pathPlainText !== 'string')
        throw new Error('AmazonSESAdapter templates are not properly configured.');

      if (callback && typeof callback !== 'function')
        throw new Error('AmazonSESAdapter template callback is not a function.');
    });

    this.ses = new AmazonSES(accessKeyId, secretAccessKey, region);
    this.fromAddress = fromAddress;
    this.templates = templates;
  }

  /**
   * Method to send emails via AmazonSESAdapter
   *
   * @param {object} options, options object with the following parameters:
   * @param {string} options.subject, email's subject
   * @param {string} options.link, to reset password or verify email address
   * @param {object} options.user, the Parse.User object
   * @param {string} options.pathPlainText, path to plain-text version of email template
   * @param {string} options.pathHtml, path to html version of email template
   * @returns {promise}
   */
  _sendMail(options) {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  /**
   * _sendMail wrapper to send an email with password reset link
   * @param {object} options, options object with the following parameters:
   * @param {string} options.link, to reset password or verify email address
   * @param {string} options.appName, the name of the parse-server app
   * @param {object} options.user, the Parse.User object
   * @returns {promise}
   */
  sendPasswordResetEmail({link, appName, user}) {
    return this._sendMail({
      link,
      appName,
      user,
      templateConfig: this.templates.passwordResetEmail
    });
  }

  /**
   * _sendMail wrapper to send an email with an account verification link
   * @param {object} options, options object with the following parameters:
   * @param {string} options.link, to reset password or verify email address
   * @param {string} options.appName, the name of the parse-server app
   * @param {object} options.user, the Parse.User object
   * @returns {promise}
   */
  sendVerificationEmail({link, appName, user}) {
    return this._sendMail({
      link,
      appName,
      user,
      templateConfig: this.templates.verificationEmail
    });
  }

  /**
   * _sendMail wrapper to send general purpose emails
   * @param {object} options, options object with the following parameters:
   * @param {object} options.templateName, name of template to be used
   * @param {object} options.subject, overrides the default value
   * @param {object} options.fromAddress, overrides the default from address
   * @param {object} options.recipient, email's recipient
   * @param {object} options.variables, an object whose property names represent
   *   template variables,vand whose values will replace the template variable
   *   placeholders
   * @returns {promise}
   */
  send({templateName, subject, fromAddress, recipient, variables = {}}) {
    return this._sendMail({
      templateName,
      subject,
      fromAddress,
      recipient,
      variables
    });
  }

  /**
   * Simple Promise wrapper to asynchronously fetch the contents of a template.
   * @param {string} path
   * @returns {promise}
   */
  loadEmailTemplate(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }

}

module.exports = AmazonSESAdapter;
