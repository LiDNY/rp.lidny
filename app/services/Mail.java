package services;

import com.google.inject.Inject;
import controllers.routes;
import entities.User;
import i18n.Txt;
import play.libs.mailer.Email;
import play.libs.mailer.MailerClient;
import utils.Config;

import java.util.List;


public class Mail {
    @Inject
    private MailerClient mailerClient;

    private void send(String replyTo, String to, String subject, String body) {
        Email m = new Email();
        m.setSubject(subject);
        m.addTo(to);
        m.setBodyText(body);
        m.setFrom(Config.Option.MAIL_FROM.get());
        m.setReplyTo(List.of(replyTo));
        mailerClient.send(m);
    }

    public void lostPassword(User user, String host, String baseUrl, String lang, Long ts, String sig) {
        String subject = Txt.get(lang, "lostPasswordSubject", host);
        String body = "";
        body += Txt.get(lang, "hi", user.getName()) + "\n";
        body += "\n";
        body += Txt.get(lang, "lostPasswordMail1") + "\n";
        body += "\n";
        body += Txt.get(lang, "lostPasswordMail2") + "\n";
        body += baseUrl + routes.LoginController.newPw(ts, user.getEmail(), sig) + "\n";
        body += "\n";
        body += Txt.get(lang, "lostPasswordMail3") + "\n";
        body += baseUrl + routes.LoginController.linkLogin(ts, user.getEmail(), sig) + "\n";
        body += "\n";
        body += "          - " + Txt.get(lang, "team") + "\n";
        send(Config.Option.MAIL_FROM.get(), user.getEmail(), subject, body);
    }
}
