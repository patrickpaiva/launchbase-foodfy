const crypto = require('crypto')
const User = require('../models/User')
const mailer = require('../../lib/mailer')
const { hash } = require('bcrypt')

module.exports = {
    loginForm(req, res) {
        return res.render("admin/session/login")
    },
    login(req, res) {
        req.session.userId = req.user.id
        req.session.isAdmin = req.user.is_admin

        return res.redirect("/users/admin/profile")
    },
    logout(req, res) {
        req.session.destroy()
        return res.redirect('/')
    },
    forgotForm(req, res) {
        return res.render("admin/session/forgot-password")
    },
    async forgot(req,res ) {
        try {
            const user = req.user
            // um token para esse usuário
            const token = crypto.randomBytes(20).toString("hex")

            // criar uma expiração pro token
            let now = new Date()
            now = now.setHours(now.getHours() + 1)

            await User.update(user.id, {
                reset_token: token,
                reset_token_expires: now
            })

            // enviar um email com um link de recuperação de senha
            await mailer.sendMail({
                to: user.email,
                from: 'no-reply@foodfy.com.br',
                subject: 'Recuperação de Senha',
                html: `<h2>Perdeu a chave?</h2>
                <p>Não se preocupe, clique no link abaixo para recuperar a sua senha</p>
                <p>
                    <a href="http:///localhost:3000/users/password-reset?token=${token}" target="_blank">
                        RECUPERAR SENHA
                    </a>
                </p>
                `
            })

            // avisar o usuário que envamos o email
            return res.render("admin/session/forgot-password", {
                success: "Verifique seu email para resetar sua senha!"
            })

        }
        catch (err) {
            console.error(err)
            return res.render("admin/session/forgot-password", {
                error: "Erro inesperado, tente novamente."
            }) 
        }
        


    },
    resetForm(req, res) {
        return res.render("admin/session/password-reset", { token: req.query.token })
    },
    async reset(req, res) {
        const user = req.user
        const { password, token } = req.body
        try {
            // cria um novo hash de senha
            const newPassword = await hash(password, 8)

            // atualiza o usuario
            await User.update(user.id, {
                password: newPassword,
                reset_token: "",
                reset_token_expires: "",
            })
            // avisa o usuario que ele tem uma nova senha
            return res.render("admin/session/login", {
                user: req.body,
                success: "Senha atualizada! Faça o seu login."
            })
        }
        catch (err) {
            console.error(err)
            return res.render("admin/session/password-reset", {
                user: req.body,
                token,
                error: "Erro inesperado, tente novamente."
            }) 
        }
    }
}