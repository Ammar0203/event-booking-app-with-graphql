import  User from '../models/user.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserInputError } from './errorHandling.js'

const authResolver = {
    Mutation: {
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email: email })
            if (!user) {
                UserInputError('هذا الحساب غير موجود لدينا!!')
            }
            const isEqual = await bcrypt.compare(password, user.password)
            if (!isEqual) {
                UserInputError('خطأ في البريد الإلكتروني أو كلمة المرور!!')
            }
            const userForToken = {
                email: user.email,
                id: user.id,
            }
            return {
                userId: user.id,
                token: jwt.sign(userForToken, process.env.JWT_SECRET),
                username: user.username
            }
        },

        createUser: async (_, args) => {
            try {
                const existingUser = await User.findOne({ email: args.userInput.email })
                if (existingUser) {
                    UserInputError('!!هذا الحساب موجود مسبقًا لدينا', {
                        invalidArgs: args.userInput.email,
                    })
                }
                const hashedPassword = await bcrypt.hash(args.userInput.password, 12)
                const user = new User({
                    username: args.userInput.username,
                    email: args.userInput.email,
                    password: hashedPassword
                })
                await user.save()
                const userForToken = {
                    email: user.email,
                    id: user.id,
                }
                return {
                    userId: user.id,
                    token: jwt.sign(userForToken, process.env.JWT_SECRET),
                    username: user.username
                }
            } catch (err) {
                throw err
            }
        }
    }
}

export { authResolver }